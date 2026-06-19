import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { BadRequestError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { SUBSCRIPTION } from "@/lib/subscription";
import { z } from "zod";

/** GET /api/admin/subscriptions — infirmiers avec demande d'abonnement en attente + état global. */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const nurses = await prisma.nurseProfile.findMany({
      where: { verificationStatus: "APPROVED" },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: [{ subscriptionRequested: "desc" }, { subscriptionExpiresAt: "asc" }],
    });
    return ok({ nurses, plans: SUBSCRIPTION.plans });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  nurseId: z.string().min(1),
  plan: z.enum(["MONTHLY", "ANNUAL"]),
  action: z.enum(["activate", "revoke"]).default("activate"),
});

/** PATCH /api/admin/subscriptions — l'admin active (ou révoque) l'abonnement d'un infirmier. */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const { nurseId, plan, action } = schema.parse(await req.json());
    const planDef = SUBSCRIPTION.plans[plan];
    if (!planDef) throw new BadRequestError("Formule inconnue");

    const nurse = await prisma.nurseProfile.findUnique({ where: { id: nurseId } });
    if (!nurse) throw new NotFoundError("Infirmier introuvable");

    if (action === "revoke") {
      const updated = await prisma.nurseProfile.update({
        where: { id: nurseId },
        data: { subscriptionExpiresAt: new Date(0), subscriptionRequested: false },
      });
      await notify({ userId: nurse.userId, type: "GENERIC", title: "Abonnement suspendu", message: "Votre abonnement a été suspendu. Contactez l'administration." });
      return ok({ nurse: updated });
    }

    // Prolonge à partir de la date d'expiration en cours si encore active, sinon à partir de maintenant.
    const base = nurse.subscriptionExpiresAt && new Date(nurse.subscriptionExpiresAt) > new Date()
      ? new Date(nurse.subscriptionExpiresAt)
      : new Date();
    const expires = new Date(base.getTime() + planDef.days * 86400000);

    const updated = await prisma.nurseProfile.update({
      where: { id: nurseId },
      data: { subscriptionPlan: plan, subscriptionExpiresAt: expires, subscriptionRequested: false },
    });

    await notify({
      userId: nurse.userId,
      type: "GENERIC",
      title: "Abonnement activé ✅",
      message: `Votre abonnement ${planDef.label} est actif jusqu'au ${expires.toLocaleDateString("fr-FR")}.`,
    });

    return ok({ nurse: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
