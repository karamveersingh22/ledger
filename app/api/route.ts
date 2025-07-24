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
    const userData = token && (verifyToken(token) as { id: string });
    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 🔥 Delete existing data
    await mas.deleteMany({ User: userData.id }); // delete previous data of this user

    const data = await request.json();
    // ✅ Insert fresh data

    const enrichedData = Array.isArray(data)
      ? data.map((d) => ({ ...d, user: userData.id }))
      : { ...data, user: userData.id };

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
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userData = verifyToken(token) as { id: string };

    // ✅ Get only this user's records
    const userRecords = await mas.find({ user: userData.id });

    return NextResponse.json(userRecords);
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
};
