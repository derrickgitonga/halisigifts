import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

const PUBLIC_ADMIN_API_PATHS = [
  "/api/admin/auth/forgot-password",
  "/api/admin/auth/reset-password",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const userRole = (req.auth?.user as any)?.role;
  const isAdmin = isLoggedIn && userRole === "ADMIN";

  // Handle /api/admin/* routes
  if (pathname.startsWith("/api/admin")) {
    const isPublicApi = PUBLIC_ADMIN_API_PATHS.some((path) =>
      pathname.startsWith(path)
    );

    if (isPublicApi) {
      return NextResponse.next();
    }

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // Handle /admin/* page routes
  if (pathname.startsWith("/admin")) {
    const isPublicPage = PUBLIC_ADMIN_PATHS.some((path) =>
      pathname === path || pathname.startsWith(`${path}/`)
    );

    if (isPublicPage) {
      if (isAdmin && pathname === "/admin/login") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!isAdmin) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
