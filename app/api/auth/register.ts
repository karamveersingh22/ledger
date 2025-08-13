// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { connectdb } from "@/dbconfig/db";
// import { User } from "@/models/user_schema";

// connectdb();

// export async function POST(request: NextRequest) {
//   const { username, password, role } = await request.json();

//   // Only admin can create users (add your admin check here)
//   // Example: check for admin token in cookies or headers

//   // Hash password
//   const hashedPassword = await bcrypt.hash(password, 10);

//   try {
//     const user = new User({ username, password: hashedPassword, role });
//     await user.save();
//     return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }