import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  handleApiError,
} from "@/lib/errors";
import { ok } from "@/lib/api";
import { getPaymentGateway } from "@/lib/payment";
import { config } from "@/lib/config";
import { notify } from "@/lib/notifications";
import { z } from "zod";

const paySchema = z.object({ bookingId: z.string().min(1) });

/**
 * POST /api/payments
 * Initialise (et, avec le mock, confirme) le paiement d'une réservation.
 * En production avec Flouci/Konnect : renvoie redirectUrl puis webhook de confirmation.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { bookingId } = paySchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, patient: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (booking.patientId !== session.sub) throw new ForbiddenError();
    if (booking.payment?.status === "PAID") {
      throw new BadRequestError("Déjà payé");
    }

    const gateway = getPaymentGateway();
    const result = await gateway.init({
      bookingId,
      amount: booking.price,
      currency: "TND",
      description: `Visite infirmier - ${booking.serviceType}`,
      customerEmail: booking.patient.email,
      successUrl: `${config.appUrl}/dashboard/patient?payment=success`,
      failUrl: `${config.appUrl}/dashboard/patient?payment=fail`,
    });

    const payment = await prisma.payment.update({
      where: { bookingId },
      data: {
        provider: gateway.name,
        providerRef: result.providerRef,
        status: result.status,
        paidAt: result.status === "PAID" ? new Date() : null,
      },
    });

    if (payment.status === "PAID") {
      await notify({
        userId: booking.patientId,
        type: "PAYMENT_RECEIVED",
        title: "Paiement confirmé",
        message: `Votre paiement de ${booking.price} TND a été reçu.`,
        metadata: { bookingId },
      });
    }

    return ok({ payment, redirectUrl: result.redirectUrl });
  } catch (err) {
    return handleApiError(err);
  }
}
