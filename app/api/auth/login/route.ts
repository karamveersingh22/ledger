import { connectdb } from "@/dbconfig/db";
import { User } from "@/models/user_schema";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
connectdb();

export const POST = async (req: NextRequest) => {
  try {
    const reqbody = await req.json();
    const { phone, password } = reqbody;

    const existingUser = await User.findOne({ phone });
    if (!existingUser) {
      console.log("user not found, register yourself");
      return NextResponse.json({ message: "User not found, register again" }, { status: 404 });
    }
    const match = bcrypt.compare(password, existingUser.password);
    if (!match) return NextResponse.json({ message: "Password didnt match" });

    const token = jwt.sign(
      { userId: existingUser._id, phone: existingUser.phone },
      process.env.secret!,
      { expiresIn: "7d" }
    );
    const response = NextResponse.json({
      message: "login successful",
      success: true,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure : false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.log(error,"error in loggin in from the backend");
    return NextResponse.json({success: false})
  }
};
