import { connectdb } from "@/dbconfig/db";
import fs from 'fs/promises'
import { lgr } from "@/models/lgr_schema";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user_schema"; // Needed to resolve user _id from username in token
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
    // Verify the user via token (cookie)
    const token = (await cookies()).get("token")?.value;
    const result = token ? verifyToken(token) : { success: false };
    if (!result.success || !result.decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { username } = result.decoded;

    // Resolve current user _id (token currently doesn't carry id)
    const userDoc = await User.findOne({ username }).select('_id');
    if (!userDoc) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete previous lgr rows for this user before inserting fresh upload
    await lgr.deleteMany({ user: userDoc._id });

    const data = await request.json();

    const userId = userDoc._id;
    const enrichedData = Array.isArray(data)
      ? data.map((d) => ({ ...d, user: userId }))
      : { ...data, user: userId };

    if (Array.isArray(enrichedData)) {
      await lgr.insertMany(enrichedData);
    } else {
      await lgr.create(enrichedData);
    }
    console.log("lgr data inserted in db by the backend");
    return NextResponse.json(
      { message: "lgr Data inserted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("lgr upload error from the backend", error);
    return NextResponse.json({ message: "lgr upload error in backend" }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const codeParam = searchParams.get('code');

    // Verify auth via cookie
    const token = (await cookies()).get("token")?.value;
    const result = token ? verifyToken(token) : { success: false };
    if (!result.success || !result.decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { username } = result.decoded;

    const userDoc = await User.findOne({ username }).select('_id');
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query: always constrain by user; optionally by code
    const query: any = { user: userDoc._id };
    if (codeParam) {
      const numeric = Number(codeParam);
      if (!isNaN(numeric)) {
        query.CODE = numeric; // Match numeric CODE field
      } else {
        // Fallback: try matching MAIN_KEY or K1 if provided code isn't numeric
        query.$or = [{ MAIN_KEY: codeParam }, { K1: codeParam }];
      }
    }

    // Fetch sorted by DATE ascending. Some rows may have invalid/epoch placeholder dates.
    // We'll sort at DB level, then ensure stable ordering in memory placing null/invalid at end.
    let records = await lgr.find(query).sort({ DATE: 1, _id: 1 }).lean();
    // Additional safety: move records with falsy DATE to end preserving relative order.
    const withDate: any[] = [];
    const withoutDate: any[] = [];
    for (const r of records) {
      if (r.DATE) withDate.push(r); else withoutDate.push(r);
    }
    records = [...withDate, ...withoutDate];
    return NextResponse.json(records, { status: 200 });
  } catch (error: any) {
    console.error('lgr GET error:', error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
};
  