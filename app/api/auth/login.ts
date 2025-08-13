import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const { username, password, role } = await request.json();

  // Read users.json
  const usersPath = path.join(process.cwd(), "users.json");
  const usersRaw = await fs.readFile(usersPath, "utf-8");
  const users = JSON.parse(usersRaw);

  // Find user
  const user = users.find(
    (u: any) => u.username === username && u.password === password && u.role === role
  );
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Create JWT
  const token = jwt.sign(
    { username: user.username, role: user.role },
    process.env.secret!,
    { expiresIn: "24h" }
  );

  // Set token in cookie
  return NextResponse.json({ token, role: user.role }, {
    status: 200,
    headers: {
      "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Strict`
    }
  });
}