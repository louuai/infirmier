import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";

/** GET /api/admin/stats - tableau de bord global. */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      patients,
      nurses,
      pendingNurses,
      bookings,
      bookingsToday,
      bookingsMonth,
      revenue,
      commission,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.user.count({ where: { role: "NURSE" } }),
      prisma.nurseProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({ _sum: { platformAmount: true } }),
    ]);

    return ok({
      stats: {
        patients,
        nurses,
        pendingNurses,
        bookings,
        bookingsToday,
        bookingsMonth,
        revenue: revenue._sum.amount ?? 0,
        commissionTotal: commission._sum.platformAmount ?? 0,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
