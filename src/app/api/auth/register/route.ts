import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations";
import { ConflictError, handleApiError } from "@/lib/errors";
import { created } from "@/lib/api";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictError("Cet email est déjà utilisé");

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role,
        ...(input.role === "PATIENT"
          ? { patientProfile: { create: {} } }
          : { nurseProfile: { create: {} } }),
      },
    });

    logger.info({ userId: user.id, role: user.role }, "Nouvel utilisateur");

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const res = created({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
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
