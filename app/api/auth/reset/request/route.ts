import { NextResponse } from 'next/server';
import { User } from '@/models/user_schema';

// In-memory store for reset codes (for demo; use DB/Redis in production)
const resetCodes: Record<string, string> = {};

export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ success: false, message: 'Phone is required' }, { status: 400 });
  }

  // Check if user exists
  const user = await User.findOne({ phone });
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes[phone] = code;

  // Simulate sending code (in real app, send via SMS/email)
  console.log(`Reset code for ${phone}: ${code}`);

  return NextResponse.json({ success: true, message: 'Reset code sent (check console in dev)' });
}

// Export for testability
export { resetCodes }; 