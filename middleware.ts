import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyTokenEdge(token: string): Promise<{ success: boolean; decoded?: { username: string; role: string } }> {
  const secret = process.env.secret;
  if (!secret) return { success: false };
  const key = new TextEncoder().encode(secret);
  try {
    const { payload } = await jwtVerify(token, key);
    const username = (payload as any)?.username;
    const role = (payload as any)?.role;
    if (typeof username !== 'string' || typeof role !== 'string') return { success: false };
    return { success: true, decoded: { username, role } };
  } catch {
    return { success: false };
  }
}

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // Protect /manage for admins only
  if (pathname.startsWith('/manage')) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url), 302); // use 302 instead of default 307
    }
    const { success, decoded } = await verifyTokenEdge(token);
    if (!success || !decoded || decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url), 302);
    }
    
  }

  // Prevent authenticated users from visiting /login
  if (pathname === '/login') {
    if (token) {
      const { success, decoded } = await verifyTokenEdge(token);
      if (success && decoded) {
        const target = decoded.role === 'admin' ? '/manage' : '/';
        if (pathname !== target) {
          return NextResponse.redirect(new URL(target, req.url), 302);
        }
      }
    }
  }
  // if (pathname.startsWith("/company")) {
  //   if (!token) {
  //     return NextResponse.redirect(new URL("/login", req.url));
  //   }
  //   const { success, decoded } = verifyToken(token);
  //   if (!success || !decoded) {
  //     return NextResponse.redirect(new URL("/login", req.url));
  //   }
  //   // Both admin and client can access /company
  // }
  return NextResponse.next();
}

export const config = {
  matcher: ['/manage', '/manage/:path*', '/login'],
};