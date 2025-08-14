import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // Only protect /admin and /company/:path*
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    let result;
    try {
      result = verifyToken(token);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const { success, decoded } = result || {};
    if (!success || !decoded || decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/manage", req.url));
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
  matcher: ["/admin", "/admin/:path*"],
};