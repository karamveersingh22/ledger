import zlib from "zlib";
import { NextRequest } from "next/server";

/**
 * Shared helper for the two JSON upload routes (`/api` for master, `/api/company`
 * for ledger).
 *
 * Uploads are gzipped by the browser before being POSTed, because Vercel caps a
 * serverless function request body at ~4.5 MB and a real ledger export is far
 * bigger than that (a 34k-row export is ~11 MB of raw JSON, ~0.86 MB gzipped).
 * The client marks a compressed body with the `x-payload-encoding: gzip` header
 * and sends it as `application/octet-stream`; plain JSON bodies are still
 * accepted so older clients / manual API calls keep working.
 *
 * This helper only reads and validates. It never touches the database — callers
 * must finish validation successfully *before* deleting the user's previous
 * data, so a bad upload can never leave a client with an empty ledger.
 */

/** Error carrying the HTTP status the route should reply with. */
export class UploadPayloadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadPayloadError";
    this.status = status;
  }
}

/** Guard against a gzip bomb: refuse anything that inflates past this. */
const MAX_DECOMPRESSED_BYTES = 64 * 1024 * 1024; // 64 MB

/**
 * Reads the request body (gzipped or plain), parses it and validates that it
 * looks like uploadable data. Returns the records as an array.
 *
 * Throws `UploadPayloadError` with a message safe to show the user.
 */
export async function readUploadPayload(request: NextRequest): Promise<any[]> {
  let text: string;

  if (request.headers.get("x-payload-encoding") === "gzip") {
    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0) {
      throw new UploadPayloadError("The upload was empty or the connection dropped.");
    }
    try {
      text = zlib
        .gunzipSync(buffer, { maxOutputLength: MAX_DECOMPRESSED_BYTES })
        .toString("utf8");
    } catch {
      throw new UploadPayloadError(
        "The uploaded file could not be decompressed. It may have been corrupted in transit."
      );
    }
  } else {
    text = await request.text();
    if (!text) {
      throw new UploadPayloadError("The upload was empty or the connection dropped.");
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error: any) {
    throw new UploadPayloadError(
      `The file is not valid JSON (${error?.message ?? "parse failed"}).`
    );
  }

  // A single object is accepted and treated as a one-record upload; the normal
  // case is an array of records.
  const records = Array.isArray(parsed) ? parsed : [parsed];

  if (records.length === 0) {
    throw new UploadPayloadError("The file contains no records.");
  }
  if (
    records.some((r) => r === null || typeof r !== "object" || Array.isArray(r))
  ) {
    throw new UploadPayloadError(
      "The file must contain a list of records (objects), not plain values."
    );
  }

  return records;
}
