import { NextRequest, NextResponse } from "next/server";

import fs from "fs/promises";
import path from "path";
import { mas } from "@/models/mas_schema";
import { lgr } from "@/models/lgr_schema";

// Add a new client user to users.json
export async function POST(request: NextRequest) {
  const { username, password, role } = await request.json();
  if (role !== "client") {
    return NextResponse.json({ error: "Only client users can be added." }, { status: 400 });
  }
  const usersPath = path.join(process.cwd(), "users.json");
  const usersRaw = await fs.readFile(usersPath, "utf-8");
  const users = JSON.parse(usersRaw);
  const existing = users.find((u: any) => u.username === username);
  if (existing) {
    return NextResponse.json({ error: "Username already exists." }, { status: 400 });
  }
  users.push({ username, password, role });
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf-8");
  return NextResponse.json({ message: "Client user added successfully." }, { status: 201 });
}

// Delete a client user from users.json
export async function DELETE(request: NextRequest) {
  const { username } = await request.json();
  const usersPath = path.join(process.cwd(), "users.json");
  const usersRaw = await fs.readFile(usersPath, "utf-8");
  let users = JSON.parse(usersRaw);
  const user = users.find((u: any) => u.username === username && u.role === "client");
  if (!user) {
    return NextResponse.json({ error: "User not found or not a client." }, { status: 404 });
  }
  // Delete MAS and LGR data for this user from DB, handle errors gracefully
  try {
    await mas.deleteMany({ user: username });
  } catch (err) {
    // Ignore if no data exists or DB error
  }
  try {
    await lgr.deleteMany({ user: username });
  } catch (err) {
    // Ignore if no data exists or DB error
  }
  users = users.filter((u: any) => !(u.username === username && u.role === "client"));
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf-8");
  return NextResponse.json({ message: "User deleted successfully." }, { status: 200 });
}

// Get all client users from users.json
export async function GET() {
  const usersPath = path.join(process.cwd(), "users.json");
  const usersRaw = await fs.readFile(usersPath, "utf-8");
  const users = JSON.parse(usersRaw);
  const clients = users.filter((u: any) => u.role === "client");
  return NextResponse.json(clients, { status: 200 });
}
