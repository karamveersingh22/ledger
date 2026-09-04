import { connectdb } from "@/dbconfig/db";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { mas } from "@/models/mas_schema";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { readUploadPayload, UploadPayloadError } from "@/lib/uploadPayload";

connectdb();

// Large master uploads (gunzip + parse + insertMany of thousands of rows) can
// outlast the short default function timeout, so ask for the full 60s.
export const maxDuration = 60;
export const runtime = "nodejs";

// code for reading json file from the file provided locally.
// export const POST = async (request : NextRequest)=>{
//     try {
//         const data = await fs.readFile("E:/coding/papa/bills/mas.json","utf-8")
//     const jsonarray = JSON.parse(data)
//     const response = await mas.insertMany(jsonarray);
//     console.log(response,"data uploaded to the db succesfully");
//         return NextResponse.json(response)
//     } catch (error : any) {
//         console.log("uploading data to the database error");
//         return NextResponse.json(error)
//     }
// }

export const POST = async (request: NextRequest) => {
  try {
    // verifying the user through token from cookies
    const token = (await cookies()).get("token")?.value;
    const result = token ? verifyToken(token) : { success: false };
    if (!result.success || !result.decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userData = result.decoded;

    // Read + validate the new upload BEFORE touching existing data, so a bad or
    // truncated file leaves the previous master untouched.
    const records = await readUploadPayload(request);

    const enrichedData = records.map((d) => ({ ...d, user: userData.username }));

    // Only now that the upload is known-good: replace this user's master data.
    await mas.deleteMany({ user: userData.username });
    await mas.insertMany(enrichedData);

    console.log(`mas data inserted in db by the backend (${enrichedData.length} records)`);
    return NextResponse.json(
      { message: "mas Data inserted successfully", count: enrichedData.length },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof UploadPayloadError) {
      // Nothing was deleted — the previous master data is still intact.
      console.log("mas upload rejected:", error.message);
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.log("mas upload error from the backend", error);
    return NextResponse.json(
      { message: "mas upload error in backend" },
      { status: 500 }
    );
  }
};

export const GET = async (request: NextRequest) => {
  try {
    // fetching from the header
    // const token = request.headers.get("authorization")?.split(" ")[1];
    // if (!token) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // fetching from the cookies
    const token = (await cookies()).get("token")?.value;
    const result = token ? verifyToken(token) : { success: false };
    if (!result.success || !result.decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  const userData = result.decoded;
  // Optional: filter to a single company by CODE (used by the ledger screen
  // to read YR_BAL / opening balance for outstanding calculations).
  const { searchParams } = new URL(request.url);
  const codeParam = searchParams.get("code");
  const query: any = { user: userData.username };
  if (codeParam) {
    const numeric = Number(codeParam);
    if (!isNaN(numeric)) query.CODE = numeric;
  }
  // ✅ Get only this user's records (by username)
  const userRecords = await mas.find(query);
  return NextResponse.json(userRecords);
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
};
