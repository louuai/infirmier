import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { updateBookingStatusSchema } from "@/lib/validations";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  handleApiError,
} from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import type { BookingStatus } from "@prisma/client";

/**
 * PATCH /api/bookings/[id]/status
 * L'infirmier accepte/refuse/démarre/termine une réservation.
 * Transitions autorisées explicitement contrôlées.
 */
const TRANSITIONS: Record<string, { from: BookingStatus; to: BookingStatus }> = {
  accept: { from: "PENDING_NURSE", to: "ACCEPTED" },
  refuse: { from: "PENDING_NURSE", to: "REFUSED" },
  start: { from: "ACCEPTED", to: "IN_PROGRESS" },
  complete: { from: "IN_PROGRESS", to: "COMPLETED" },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(req, "NURSE");
    const { id } = await params;
    const { action } = updateBookingStatusSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { nurse: true, payment: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (booking.nurse.userId !== session.sub) throw new ForbiddenError();

    const t = TRANSITIONS[action];
    if (!t || booking.status !== t.from) {
      throw new BadRequestError(
        `Transition impossible depuis le statut ${booking.status}`,
      );
    }

    // À l'acceptation : le paiement doit avoir été réglé.
    if (action === "accept" && booking.payment?.status !== "PAID") {
      throw new BadRequestError("Le paiement n'a pas été confirmé");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: t.to,
          ...(action === "complete" ? { completedAt: new Date() } : {}),
        },
      });

      // À la complétion : générer la commission + la facture.
      if (action === "complete") {
        await tx.commission.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            nurseId: booking.nurseId,
            rate: booking.commissionRate,
            platformAmount: booking.commissionAmount,
            nurseAmount: booking.nurseAmount,
            status: "PENDING",
          },
          update: {},
        });

        const count = await tx.invoice.count();
        await tx.invoice.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            nurseId: booking.nurseId,
            number: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`,
            amount: booking.price,
            commission: booking.commissionAmount,
            nurseAmount: booking.nurseAmount,
            status: "PAID",
          },
          update: {},
        });
      }
      return b;
    });

    const typeMap = {
      accept: "BOOKING_ACCEPTED",
      refuse: "BOOKING_REFUSED",
      complete: "BOOKING_COMPLETED",
      start: "GENERIC",
    } as const;

    await notify({
      userId: booking.patientId,
      type: typeMap[action],
      title: "Mise à jour de votre réservation",
      message: `Statut: ${updated.status}`,
      metadata: { bookingId: id },
    });

    return ok({ booking: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
