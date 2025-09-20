import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // Protect /manage for admins only
  if (pathname.startsWith('/manage')) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url), 302); // use 302 instead of default 307
    }
    let result;
    try {
      result = verifyToken(token);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url), 302);
    }
    const { success, decoded } = result || {};
    if (!success || !decoded || decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url), 302);
    }
    
  }

  // Prevent authenticated users from visiting /login
  if (pathname === '/login') {
    if (token) {
      try {
        const { success, decoded } = verifyToken(token);
        if (success && decoded) {
          const target = decoded.role === 'admin' ? '/manage' : '/';
          if (pathname !== target) {
            return NextResponse.redirect(new URL(target, req.url), 302);
          }
        }
      } catch {
        // ignore invalid token (they can see login page)
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
  // matcher: ['/manage', '/manage/:path*', '/login'],
  matcher: ['/login'],
};