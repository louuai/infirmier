import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeGoogleCode, googleConfigured } from "@/lib/google";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { config } from "@/lib/config";

export async function GET(req: NextRequest) {
  try {
    if (!googleConfigured) {
      return NextResponse.redirect(`${config.appUrl}/login?error=google_not_configured`);
    }
    const code = req.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.redirect(`${config.appUrl}/login?error=google`);

    const profile = await exchangeGoogleCode(code);

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.id }, { email: profile.email }] },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.id,
          firstName: profile.given_name ?? "Utilisateur",
          lastName: profile.family_name ?? "",
          avatarUrl: profile.picture,
          role: "PATIENT",
          patientProfile: { create: {} },
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id } });
    }

    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    const dest =
      user.role === "ADMIN" ? "/admin" : user.role === "NURSE" ? "/dashboard/nurse" : "/dashboard/patient";
    const res = NextResponse.redirect(`${config.appUrl}${dest}`);
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.redirect(`${config.appUrl}/login?error=google`);
  }
}
