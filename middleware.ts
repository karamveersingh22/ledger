// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/admin','/client','/'])

export default clerkMiddleware(async (auth, req) => {
  // Restrict admin routes to users with specific permissions
  if (isProtectedRoute(req)) {
    await auth.protect((has) => {
      return has({ permission: 'Manage members' }) || has({ permission: 'Read members' })
    })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/client(.*)']);

// export default clerkMiddleware(async (auth, req) => {
//   const { userId } = await auth();

//   if (!userId && isProtectedRoute(req)) {
//     return NextResponse.redirect(new URL("/sign-in", req.url));
//   }

//   if (userId && isProtectedRoute(req)) {
//     // If you need the full user object, you can still use currentUser
//     const { currentUser } = await import("@clerk/nextjs/server");
//     const user = await currentUser();
//     const role = user?.publicMetadata?.role;

//     const url = req.nextUrl;

//     if (url.pathname.startsWith("/admin") && role !== "admin") {
//       return NextResponse.redirect(new URL("/unauthorized", req.url));
//     }

//     if (url.pathname.startsWith("/client") && role !== "member") {
//       return NextResponse.redirect(new URL("/unauthorized", req.url));
//     }
//   }

//   return NextResponse.next();
// });



// middleware.js not working but running this previously


// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// // Define route matchers for protected routes
// const isAdminRoute = createRouteMatcher(['/admin(.*)']);
// const isClientRoute = createRouteMatcher(['/client(.*)']);
// const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/client(.*)']);

// export default clerkMiddleware((auth, req) => {
//   // Get the current user's authentication status
//   const { userId, sessionClaims } = auth();

//   // If user is not authenticated and trying to access protected routes
//   if (!userId && isProtectedRoute(req)) {
//     return NextResponse.redirect(new URL("/sign-in", req.url));
//   }

//   // If user is authenticated, check role-based access
//   if (userId) {
//     // Get user role from session claims or public metadata
//     const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;

//     // Check admin route access
//     if (isAdminRoute(req) && role !== "admin") {
//       return NextResponse.redirect(new URL("/unauthorized", req.url));
//     }

//     // Check client route access
//     if (isClientRoute(req) && role !== "member") {
//       return NextResponse.redirect(new URL("/unauthorized", req.url));
//     }
//   }

//   // Allow the request to proceed
//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     // '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//       "/admin/:path*", "/client/:path*"    // Always run for API routes
//     // '/(api|trpc)(.*)',
//   ],
// };



// // middleware.ts
// import { ClerkMiddleware } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { NextRequest } from "next/server";

// export default ClerkMiddleware((req: NextRequest) => {
//   const { pathname } = req.nextUrl;

//   // If user is on /redirect, decide where to send them based on role
//   if (pathname === "/redirect") {
//     // Clerk stores role in publicMetadata
//     const role = req.auth?.sessionClaims?.publicMetadata?.role;

//     if (role === "admin") {
//       return NextResponse.redirect(new URL("/admin", req.url));
//     }
//     return NextResponse.redirect(new URL("/client", req.url));
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     // Run on all routes except static files, API routes, etc.
//     "/((?!_next|static|.*\\..*|favicon.ico).*)",
//   ],
// };
