import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectdb } from '@/dbconfig/db';
import { User } from '@/models/user_schema';

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ username: null, masterPath: null, ledgerPath: null }, { status: 401 });
  }
  try {
    const decoded = jwt.verify(token, process.env.secret!);
    if (typeof decoded === 'object' && 'username' in decoded) {
      await connectdb();
      const userDoc = await User.findOne({ username: (decoded as any).username }).select('username masterPath ledgerPath role');
      if (!userDoc) {
        return NextResponse.json({ username: null, masterPath: null, ledgerPath: null }, { status: 404 });
      }
      return NextResponse.json({
        username: userDoc.username,
        masterPath: userDoc.masterPath || '',
        ledgerPath: userDoc.ledgerPath || '',
        role: userDoc.role
      }, { status: 200 });
    }
    return NextResponse.json({ username: null, masterPath: null, ledgerPath: null }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ username: null, masterPath: null, ledgerPath: null }, { status: 401 });
  }
}
