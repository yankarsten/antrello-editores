import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const home = session ? (session.role === "admin" ? "/admin" : "/editor") : null;

  if (pathname === "/login" || pathname === "/register") {
    if (home) return NextResponse.redirect(new URL(home, request.url));
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(home ?? "/login", request.url));
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/editor")) {
    if (!session) {
      const login = new URL("/login", request.url);
      return NextResponse.redirect(login);
    }
    if (pathname.startsWith("/admin") && session.role !== "admin") {
      return NextResponse.redirect(new URL("/editor", request.url));
    }
    if (pathname.startsWith("/editor") && session.role !== "editor") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/admin/:path*", "/editor/:path*"],
};
