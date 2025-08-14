import { connectdb } from "@/dbconfig/db";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { mas } from "@/models/mas_schema";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

connectdb();

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
    // Use username for user association
    await mas.deleteMany({ user: userData.username }); // delete previous data of this user
    const data = await request.json();
    // ✅ Insert fresh data
    const enrichedData = Array.isArray(data)
      ? data.map((d) => ({ ...d, user: userData.username }))
      : { ...data, user: userData.username };
    if (Array.isArray(enrichedData)) {
      await mas.insertMany(enrichedData);
    } else {
      await mas.create(enrichedData);
    }
    console.log("mas data inserted in db by the backend ");
    return NextResponse.json(
      { message: "mas Data inserted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("mas upload error from the backend", error);
    return NextResponse.json({ message: "mas upload error in backend" });
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
  // ✅ Get only this user's records (by username)
  const userRecords = await mas.find({ user: userData.username });
  return NextResponse.json(userRecords);
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
};
