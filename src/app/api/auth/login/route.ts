import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations";
import { UnauthorizedError, ForbiddenError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const input = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedError("Email ou mot de passe incorrect");
    if (!user.passwordHash) throw new UnauthorizedError("Ce compte utilise la connexion Google");
    if (!(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedError("Email ou mot de passe incorrect");
    }
    if (!user.isActive) throw new ForbiddenError("Compte désactivé");

    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    const res = ok({
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
