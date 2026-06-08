import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";

/** GET /api/admin/stats — centre de contrôle financier & opérationnel. */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const [patients, nurses, pendingNurses, bookings, bookingsToday, bookingsMonth, revenue, popular] =
      await Promise.all([
        prisma.user.count({ where: { role: "PATIENT" } }),
        prisma.user.count({ where: { role: "NURSE" } }),
        prisma.nurseProfile.count({ where: { verificationStatus: "PENDING" } }),
        prisma.booking.count(),
        prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.revenue.aggregate({ _sum: { grossAmount: true, platformAmount: true, nurseAmount: true } }),
        prisma.revenue.groupBy({ by: ["serviceSlug"], _count: { serviceSlug: true }, orderBy: { _count: { serviceSlug: "desc" } }, take: 5 }),
      ]);

    return ok({
      stats: {
        patients,
        nurses,
        pendingNurses,
        bookings,
        bookingsToday,
        bookingsMonth,
        revenue: revenue._sum.grossAmount ?? 0,
        commissionTotal: revenue._sum.platformAmount ?? 0,
        nurseRevenue: revenue._sum.nurseAmount ?? 0,
        popularServices: popular.map((p) => ({ slug: p.serviceSlug, count: p._count.serviceSlug })),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
