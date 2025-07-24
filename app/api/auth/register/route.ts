import { connectdb } from "@/dbconfig/db";
import { User } from "@/models/user_schema";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
connectdb();

export const POST = async (request: NextRequest) => {
  try {
    const reqbody = await request.json();
    const { phone, password } = reqbody;

    const existingUser = await User.findOne({ phone });
    if (existingUser)
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = User.create({phone, password:hashedPassword });
    console.log(createdUser, "user registered successfully");
    return NextResponse.json(createdUser)

  } catch (error:any) {
    console.log(error,"error in registering the User");
    return NextResponse.json({message: 'User registration problem'});
  }
};
