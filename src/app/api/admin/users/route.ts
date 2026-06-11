import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ConflictError, handleApiError } from "@/lib/errors";
import { created, ok } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

/** GET /api/admin/users - liste paginée des utilisateurs. */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const role = req.nextUrl.searchParams.get("role") ?? undefined;

    const users = await prisma.user.findMany({
      where: role ? { role: role as "PATIENT" | "NURSE" | "ADMIN" } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        nurseProfile: { select: { verificationStatus: true } },
      },
      take: 200,
    });
    return ok({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["PATIENT", "NURSE", "ADMIN"]).default("PATIENT"),
});

/** POST /api/admin/users - l'admin crée un compte (CRUD). */
export async function POST(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const input = createUserSchema.parse(await req.json());
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ConflictError("Email déjà utilisé");
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
          : input.role === "NURSE"
            ? { nurseProfile: { create: {} } }
            : {}),
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
    return created({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/admin/users - active/désactive un compte. */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const { userId, isActive } = await req.json();
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: Boolean(isActive) },
      select: { id: true, isActive: true },
    });
    return ok({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
