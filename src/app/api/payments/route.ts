import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { BadRequestError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { getPaymentGateway } from "@/lib/payment";
import { config } from "@/lib/config";
import { notify } from "@/lib/notifications";
import { z } from "zod";

const paySchema = z.object({ bookingId: z.string().min(1) });

/**
 * POST /api/payments — paiement APRÈS acceptation. Accessible en INVITÉ (par l'ID de
 * réservation). Si une session existe, la réservation lui est rattachée (historique).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req); // optionnel (invité)
    const { bookingId } = paySchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, nurse: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (booking.status !== "AWAITING_PAYMENT") {
      throw new BadRequestError("La réservation n'est pas en attente de paiement");
    }

    // Rattacher au compte connecté si présent (pour l'historique)
    if (session?.role === "PATIENT" && !booking.patientId) {
      await prisma.booking.update({ where: { id: bookingId }, data: { patientId: session.sub } });
    }

    const gateway = getPaymentGateway();
    let customerEmail = booking.guestEmail ?? "";
    if (session) {
      customerEmail = (await prisma.user.findUnique({ where: { id: session.sub } }))?.email ?? customerEmail;
    }
    const result = await gateway.init({
      bookingId,
      amount: booking.price,
      currency: "TND",
      description: "Soin infirmier à domicile",
      customerEmail,
      successUrl: `${config.appUrl}/track/${bookingId}`,
      failUrl: `${config.appUrl}/request/${bookingId}?payment=fail`,
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
      if (booking.nurse) {
        await notify({
          userId: booking.nurse.userId,
          type: "PAYMENT_RECEIVED",
          title: "Paiement reçu",
          message: `Le client a payé ${booking.price} TND. Vous pouvez démarrer la mission.`,
          metadata: { bookingId },
        });
      }
    }

    return ok({ payment, redirectUrl: result.redirectUrl });
  } catch (err) {
    return handleApiError(err);
  }
}
