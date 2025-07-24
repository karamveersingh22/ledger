import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { mas } from '@/models/mas_schema';
import { lgr } from '@/models/lgr_schema';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    const userData = verifyToken(token) as { id: string };

    if (!userData?.id) {
      return NextResponse.json({ message: 'Unauthorized - invalid token' }, { status: 401 });
    }

    await mas.deleteMany({ user: userData.id });
    await lgr.deleteMany({ user: userData.id });

    return NextResponse.json({ success: true, message: 'User data deleted' });
  } catch (error) {
    console.error("error in cleanup", error);
    return NextResponse.json({ success: false, message: 'Cleanup failed' }, { status: 500 });
  }
}
