import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { puedeAccederAdmin } from "@/lib/rbac";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && !puedeAccederAdmin(token.rol)) {
    return NextResponse.redirect(new URL("/mi-panel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mi-panel", "/mi-panel/:path*", "/admin", "/admin/:path*"],
};
