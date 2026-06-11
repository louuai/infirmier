import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { z } from "zod";

/** GET /api/admin/payouts — montants à transférer, agrégés par infirmier. */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const grouped = await prisma.payout.groupBy({
      by: ["nurseId"],
      where: { status: "PENDING" },
      _sum: { amount: true },
    });
    const nurseIds = grouped.map((g) => g.nurseId);
    const nurses = await prisma.nurseProfile.findMany({
      where: { id: { in: nurseIds } },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    });
    const map = new Map(nurses.map((n) => [n.id, `${n.user.firstName} ${n.user.lastName}`]));
    const items = grouped.map((g) => ({ nurseId: g.nurseId, name: map.get(g.nurseId) ?? "—", pending: g._sum.amount ?? 0 }));
    return ok({ payouts: items });
  } catch (err) {
    return handleApiError(err);
  }
}

const settleSchema = z.object({ nurseId: z.string().min(1) });

/**
 * PATCH /api/admin/payouts — TRANSFERT : l'admin marque tous les payouts en attente
 * d'un infirmier comme versés (il a reçu les paiements et reverse la part 80%).
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const { nurseId } = settleSchema.parse(await req.json());
    const result = await prisma.payout.updateMany({
      where: { nurseId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    await prisma.commission.updateMany({ where: { nurseId, status: "PENDING" }, data: { status: "SETTLED", settledAt: new Date() } });
    return ok({ settled: result.count });
  } catch (err) {
    return handleApiError(err);
  }
}
