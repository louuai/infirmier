import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { BadRequestError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { getPaymentGateway } from "@/lib/payment";
import { config } from "@/lib/config";
import { notify } from "@/lib/notifications";
import { z } from "zod";

const paySchema = z.object({ bookingId: z.string().min(1) });

/**
 * POST /api/payments — paiement APRÈS acceptation (connexion obligatoire).
 * Lie la réservation invité au compte qui paie, puis confirme le paiement.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { bookingId } = paySchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, nurse: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (booking.status !== "AWAITING_PAYMENT") {
      throw new BadRequestError("La réservation n'est pas en attente de paiement");
    }

    // Rattacher l'invité au compte qui paie
    if (!booking.patientId) {
      await prisma.booking.update({ where: { id: bookingId }, data: { patientId: session.sub } });
    } else if (booking.patientId !== session.sub) {
      throw new BadRequestError("Cette réservation appartient à un autre compte");
    }

    const gateway = getPaymentGateway();
    const customerEmail =
      booking.guestEmail ?? (await prisma.user.findUnique({ where: { id: session.sub } }))?.email ?? "";
    const result = await gateway.init({
      bookingId,
      amount: booking.price,
      currency: "TND",
      description: "Soin infirmier à domicile",
      customerEmail,
      successUrl: `${config.appUrl}/dashboard/patient?payment=success`,
      failUrl: `${config.appUrl}/dashboard/patient?payment=fail`,
    });

    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.price,
        provider: gateway.name,
        providerRef: result.providerRef,
        status: result.status,
        paidAt: result.status === "PAID" ? new Date() : null,
      },
      update: {
        provider: gateway.name,
        providerRef: result.providerRef,
        status: result.status,
        paidAt: result.status === "PAID" ? new Date() : null,
      },
    });

    if (payment.status === "PAID") {
      await prisma.$transaction([
        prisma.booking.update({ where: { id: bookingId }, data: { status: "PAID", paidAt: new Date() } }),
        prisma.invoice.updateMany({ where: { bookingId }, data: { status: "PAID" } }),
      ]);
      await notify({
        userId: booking.nurse.userId,
        type: "PAYMENT_RECEIVED",
        title: "Paiement reçu",
        message: `Le client a payé ${booking.price} TND. Vous pouvez démarrer la mission.`,
        metadata: { bookingId },
      });
    }

    return ok({ payment, redirectUrl: result.redirectUrl });
  } catch (err) {
    return handleApiError(err);
  }
}
