import { NextResponse } from 'next/server';
import { User } from '@/models/user_schema';
import { resetCodes } from '../request/route';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { phone, code, newPassword } = await req.json();
  if (!phone || !code || !newPassword) {
    return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
  }

  // Check code
  if (!resetCodes[phone] || resetCodes[phone] !== code) {
    return NextResponse.json({ success: false, message: 'Invalid or expired code' }, { status: 400 });
  }

  // Update password
  const hashed = await bcrypt.hash(newPassword, 10);
  const user = await User.findOneAndUpdate(
    { phone },
    { password: hashed },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  // Remove used code
  delete resetCodes[phone];

  return NextResponse.json({ success: true, message: 'Password reset successful' });
} 