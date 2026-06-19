import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { BadRequestError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { SUBSCRIPTION, nurseAccess } from "@/lib/subscription";
import { z } from "zod";

const schema = z.object({ plan: z.enum(["MONTHLY", "ANNUAL"]) });

/**
 * POST /api/subscriptions — l'infirmier demande l'activation d'un abonnement.
 * (Passerelle de paiement réelle à venir : pour l'instant l'admin valide manuellement.)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const { plan } = schema.parse(await req.json());
    const planDef = SUBSCRIPTION.plans[plan];
    if (!planDef) throw new BadRequestError("Formule inconnue");

    const nurse = await prisma.nurseProfile.findUnique({
      where: { userId: session.sub },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!nurse) throw new NotFoundError("Profil introuvable");

    await prisma.nurseProfile.update({
      where: { id: nurse.id },
      data: { subscriptionRequested: true, subscriptionPlan: plan },
    });

    // Notifie tous les admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.id,
          type: "GENERIC",
          title: "Demande d'abonnement",
          message: `${nurse.user.firstName} ${nurse.user.lastName} demande l'abonnement ${planDef.label} (${planDef.price} TND).`,
          metadata: { nurseId: nurse.id, plan },
        }),
      ),
    );

    return ok({ requested: true, plan, access: nurseAccess(nurse) });
  } catch (err) {
    return handleApiError(err);
  }
}
