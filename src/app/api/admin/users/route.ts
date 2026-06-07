import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";

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
