import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  if (!token && (pathname.startsWith("/admin") || pathname.startsWith("/client"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (token) {
    const { success, decoded } = verifyToken(token);
    if (!success || !decoded) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Role-based access
    if (pathname.startsWith("/admin") && decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (pathname.startsWith("/client") && decoded.role !== "client") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  // matcher: ["/admin/:path*", "/client/:path*"],
  matcher: ["/","/company/:path*"],
};