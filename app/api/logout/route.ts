import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Remove the token cookie by setting Max-Age=0
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Set-Cookie": "token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict"
    }
  });
}
