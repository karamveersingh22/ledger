import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectdb } from '@/dbconfig/db';
import { User } from '@/models/user_schema';
import { seedUsers } from '@/lib/seedUsers';

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }
    await connectdb();
    await seedUsers();
    // Plaintext password match (improve later with bcrypt)
    const user = await User.findOne({ username, password, role });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.secret!,
      { expiresIn: '24h' }
    );
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? ' Secure' : '';
    const response = NextResponse.json({ token, role: user.role }, {
      status: 200,
      headers: {
        'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${secureFlag}`
      }
    });
    response.cookies.set('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 24 });
    return response;
  } catch (err: any) {
    console.error('Login route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

