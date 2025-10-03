import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { connectdb } from '@/dbconfig/db';
import { User } from '@/models/user_schema';
import { mas } from '@/models/mas_schema';
import { lgr } from '@/models/lgr_schema';

async function requireAdmin() {
  const token = (await cookies()).get('token')?.value;
  if (!token) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { success, decoded } = verifyToken(token);
  if (!success || !decoded || decoded.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, decoded };
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const { username, password, role, masterPath = '', ledgerPath = '' } = await request.json();
    if (!username || !password) return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    if (role !== 'client') return NextResponse.json({ error: 'Only client users can be added.' }, { status: 400 });
    await connectdb();
    const existing = await User.findOne({ username });
    if (existing) return NextResponse.json({ error: 'User already exists.' }, { status: 400 });
    await User.create({ username, password, role: 'client', masterPath, ledgerPath });
    return NextResponse.json({ message: 'Client user added successfully.' }, { status: 201 });
  } catch (err: any) {
    console.error('Manage POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const { username } = await request.json();
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });
    await connectdb();
    const userDoc = await User.findOne({ username, role: 'client' });
    if (!userDoc) return NextResponse.json({ error: 'Client user not found' }, { status: 404 });
    try { await mas.deleteMany({ user: username }); } catch (e) { console.warn('MAS cascade failure', e); }
    try { await lgr.deleteMany({ user: userDoc._id }); } catch (e) { console.warn('LGR cascade failure', e); }
    await userDoc.deleteOne();
    return NextResponse.json({ message: 'User deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Manage DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    await connectdb();
  const clients = await User.find({ role: 'client' }).select('-__v -updatedAt');
    return NextResponse.json(clients, { status: 200 });
  } catch (err: any) {
    console.error('Manage GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

