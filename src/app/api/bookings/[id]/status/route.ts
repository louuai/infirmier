import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { updateBookingStatusSchema } from "@/lib/validations";
import { BadRequestError, ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { trigger, bookingChannel } from "@/lib/pusher";
import type { BookingStatus } from "@prisma/client";

const FLOW: Record<string, { from: BookingStatus; to: BookingStatus }> = {
  accept: { from: "REQUESTED", to: "AWAITING_PAYMENT" },
  refuse: { from: "REQUESTED", to: "REFUSED" },
  en_route: { from: "PAID", to: "EN_ROUTE" },
  arrived: { from: "EN_ROUTE", to: "ARRIVED" },
  start: { from: "ARRIVED", to: "IN_PROGRESS" },
  complete: { from: "IN_PROGRESS", to: "COMPLETED" },
};

/** PATCH /api/bookings/[id]/status — transitions pilotées par l'infirmier. */
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
    if (booking.nurse.userId !== session.sub) throw new ForbiddenError();

    const t = FLOW[action];
    if (!t || booking.status !== t.from) {
      throw new BadRequestError(`Transition impossible depuis ${booking.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // ACCEPT → génère la facture
      if (action === "accept") {
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
            status: "ISSUED",
          },
          update: {},
        });
      }

      // EN_ROUTE → démarre la session de tracking + infirmier occupé
      if (action === "en_route") {
        await tx.trackingSession.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            nurseId: booking.nurseId,
            active: true,
            lastLat: booking.nurse.currentLat,
            lastLng: booking.nurse.currentLng,
            lastUpdate: new Date(),
          },
          update: { active: true },
        });
        await tx.nurseProfile.update({ where: { id: booking.nurseId }, data: { availability: "BUSY" } });
      }

      // COMPLETE → commission + revenu + payout + clôture tracking + dispo
      if (action === "complete") {
        await tx.commission.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            nurseId: booking.nurseId,
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
        await tx.payout.create({
          data: { nurseId: booking.nurseId, amount: booking.nurseAmount, status: "PENDING" },
        });
        await tx.trackingSession.updateMany({
          where: { bookingId: id },
          data: { active: false, endedAt: new Date() },
        });
        await tx.nurseProfile.update({ where: { id: booking.nurseId }, data: { availability: "AVAILABLE" } });
      }

      return tx.booking.update({
        where: { id },
        data: {
          status: t.to,
          ...(action === "accept" ? { acceptedAt: new Date() } : {}),
          ...(action === "en_route" ? { enRouteAt: new Date() } : {}),
          ...(action === "arrived" ? { arrivedAt: new Date() } : {}),
          ...(action === "complete" ? { completedAt: new Date() } : {}),
        },
      });
    });

    // notifications + temps réel
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
