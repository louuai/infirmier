import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { z } from "zod";

/** GET /api/admin/users/[id] — fiche utilisateur + analyse. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, "ADMIN");
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { nurseProfile: true, patientProfile: true },
    });
    if (!user) throw new NotFoundError("Utilisateur introuvable");

    let analytics: Record<string, number> = {};
    let pendingPayout = 0;

    if (user.nurseProfile) {
      const nurseId = user.nurseProfile.id;
      const [missions, rev, payouts] = await Promise.all([
        prisma.booking.count({ where: { nurseId, status: "COMPLETED" } }),
        prisma.revenue.aggregate({ where: { booking: { nurseId } }, _sum: { nurseAmount: true, grossAmount: true } }),
        prisma.payout.aggregate({ where: { nurseId, status: "PENDING" }, _sum: { amount: true } }),
      ]);
      pendingPayout = payouts._sum.amount ?? 0;
      analytics = {
        missions,
        revenuBrut: rev._sum.grossAmount ?? 0,
        revenuNet: rev._sum.nurseAmount ?? 0,
        aTransferer: pendingPayout,
        note: user.nurseProfile.ratingAverage,
      };
    } else {
      const [bookings, paid] = await Promise.all([
        prisma.booking.count({ where: { patientId: id } }),
        prisma.payment.aggregate({ where: { status: "PAID", booking: { patientId: id } }, _sum: { amount: true } }),
      ]);
      analytics = { reservations: bookings, totalDepense: paid._sum.amount ?? 0 };
    }

    const { passwordHash, ...safe } = user;
    return ok({ user: safe, analytics, pendingPayout });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(["PATIENT", "NURSE", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

/** PATCH /api/admin/users/[id] — modifie l'utilisateur. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, "ADMIN");
    const { id } = await params;
    const data = updateSchema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true, role: true, isActive: true, phone: true },
    });
    return ok({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/admin/users/[id] — supprime l'utilisateur. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, "ADMIN");
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
