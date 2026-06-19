import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { updateBookingStatusSchema } from "@/lib/validations";
import { BadRequestError, ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { trigger, bookingChannel } from "@/lib/pusher";
import type { BookingStatus } from "@prisma/client";

// L'acceptation se fait via /claim (dispatch). Ici : étapes après paiement.
const FLOW: Record<string, { from: BookingStatus; to: BookingStatus }> = {
  en_route: { from: "ACCEPTED", to: "EN_ROUTE" },
  arrived: { from: "EN_ROUTE", to: "ARRIVED" },
  start: { from: "ARRIVED", to: "IN_PROGRESS" },
  complete: { from: "IN_PROGRESS", to: "COMPLETED" },
};

/** PATCH /api/bookings/[id]/status — transitions pilotées par l'infirmier (mission attribuée). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(req, "NURSE");
    const { id } = await params;
    const { action } = updateBookingStatusSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { nurse: true, service: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (!booking.nurseId || !booking.nurse || booking.nurse.userId !== session.sub) throw new ForbiddenError();
    const nurseId = booking.nurseId;

    const t = FLOW[action];
    if (!t || booking.status !== t.from) {
      throw new BadRequestError(`Transition impossible depuis ${booking.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "en_route") {
        await tx.trackingSession.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            nurseId,
            active: true,
            lastLat: booking.nurse!.currentLat,
            lastLng: booking.nurse!.currentLng,
            lastUpdate: new Date(),
          },
          update: { active: true },
        });
        await tx.nurseProfile.update({ where: { id: nurseId }, data: { availability: "BUSY" } });
      }

      if (action === "complete") {
        await tx.commission.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            nurseId,
            rate: booking.commissionRate,
            platformAmount: booking.commissionAmount,
            nurseAmount: booking.nurseAmount,
          },
          update: {},
        });
        await tx.revenue.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            grossAmount: booking.price,
            platformAmount: booking.commissionAmount,
            nurseAmount: booking.nurseAmount,
            serviceSlug: booking.service.slug,
            city: booking.city,
          },
          update: {},
        });
        // Paiement sur place : aucun versement plateforme → pas de payout.
        await tx.trackingSession.updateMany({ where: { bookingId: id }, data: { active: false, endedAt: new Date() } });
        await tx.nurseProfile.update({ where: { id: nurseId }, data: { availability: "AVAILABLE" } });
      }

      return tx.booking.update({
        where: { id },
        data: {
          status: t.to,
          ...(action === "en_route" ? { enRouteAt: new Date() } : {}),
          ...(action === "arrived" ? { arrivedAt: new Date() } : {}),
          ...(action === "complete" ? { completedAt: new Date() } : {}),
        },
      });
    });

    const notifyType = {
      accept: "REQUEST_ACCEPTED",
      refuse: "REQUEST_REFUSED",
      en_route: "NURSE_EN_ROUTE",
      arrived: "NURSE_ARRIVED",
      start: "GENERIC",
      complete: "MISSION_COMPLETED",
    } as const;
    if (booking.patientId) {
      await notify({
        userId: booking.patientId,
        type: notifyType[action],
        title: "Mise à jour de votre réservation",
        message: `Statut : ${updated.status}`,
        metadata: { bookingId: id },
      });
    }
    await trigger(bookingChannel(id), "status", { status: updated.status });

    return ok({ booking: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
