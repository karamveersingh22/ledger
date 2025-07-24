import { connectdb } from "@/dbconfig/db";
import fs from 'fs/promises'
import { lgr } from "@/models/lgr_schema";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
connectdb()

// previous code
// export const POST = async (request: NextRequest)=>{
// try {
//         const data = await fs.readFile("E:/coding/papa/bills/lgr.json","utf-8");
//         const jsonarray = JSON.parse(data)
//         const response = await lgr.insertMany(jsonarray)
//         console.log(response, "lgr data has been inserted in db");
//         return NextResponse.json(response)

// } catch (error:any) {
//     console.log(error,"error in inserting the lgr data to db in the backend");
//     return NextResponse.json(error)
// }    
// }

// export const POST = async (request: NextRequest)=>{
//     try {
//         const data = await request.json();
//         // 🔥 Delete existing data
//     await lgr.deleteMany({});

//     // ✅ Insert fresh data
        
//     // if data is an array of records
//     if (Array.isArray(data)) {
//       await lgr.insertMany(data);
//     } else {
//       await lgr.create(data);
//     }
//     console.log("lgr data inserted in db by the backend ");
//     return NextResponse.json({ message: 'lgr Data inserted successfully' }, { status: 200 });


//     } catch (error: any) {
//         console.log("lgr upload error from the backend",error);
//         return NextResponse.json({message: "lgr upload error in backend"})
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
      await lgr.deleteMany({ User: userData.id }); // delete previous data of this user
  
      const data = await request.json();
      // ✅ Insert fresh data
  
      const enrichedData = Array.isArray(data)
        ? data.map((d) => ({ ...d, user: userData.id }))
        : { ...data, user: userData.id };
  
      if (Array.isArray(enrichedData)) {
        await lgr.insertMany(enrichedData);
      } else {
        await lgr.create(enrichedData);
      }
      console.log("lgr data inserted in db by the backend ");
      return NextResponse.json(
        { message: "lgr Data inserted successfully" },
        { status: 200 }
      );
    } catch (error: any) {
      console.log("lgr upload error from the backend", error);
      return NextResponse.json({ message: "lgr upload error in backend" });
    }
  };

// export const GET = async (request : NextRequest)=>{
//     try {
//         const {searchParams} = new URL(request.url)
//         const code = searchParams.get("code");
//         const response = await lgr.find({CODE : code});
//         console.log(response, "lgr of the company successfully fetched from get backend");
//         return NextResponse.json(response)

//     } catch (error: any) {
//         console.log(error, "error in fetching the lgr data from backend");
//         return NextResponse.json(error)
        
//     }
// }

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
      const userRecords = await lgr.find({ user: userData.id });
  
      return NextResponse.json(userRecords);
    } catch (error) {
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
  