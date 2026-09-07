export const runtime = "nodejs";

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip static asset files (images, fonts, etc.)
  if (/\.(?:png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$/i.test(pathname)) {
    return;
  }

  const isLoggedIn = !!req.auth;

  // Public routes
  if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/privacy" || pathname === "/terms" || pathname.startsWith("/invite/")) {
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
      return Response.redirect(new URL("/dashboard", req.nextUrl));
    }
    return;
  }

  // Protected routes
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
