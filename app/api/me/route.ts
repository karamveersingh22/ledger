import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ username: null }, { status: 401 });
  }
  try {
    const decoded = jwt.verify(token, process.env.secret!);
    if (typeof decoded === "object" && "username" in decoded) {
      return NextResponse.json({ username: (decoded as any).username }, { status: 200 });
    }
    return NextResponse.json({ username: null }, { status: 401 });
  } catch {
    return NextResponse.json({ username: null }, { status: 401 });
  }
}
