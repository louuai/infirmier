import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

/**
 * Middleware de protection des routes par rôle.
 * Note: la vérification JWT (jose) fonctionne dans le runtime Edge.
 */
const PROTECTED: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard/patient", roles: ["PATIENT", "ADMIN"] },
  { prefix: "/dashboard/nurse", roles: ["NURSE", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(session.role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
