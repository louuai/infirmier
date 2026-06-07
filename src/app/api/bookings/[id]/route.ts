import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cancelBookingSchema } from "@/lib/validations";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  handleApiError,
} from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";

async function loadBookingForUser(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      nurse: { include: { user: true } },
      patient: true,
      payment: true,
    },
  });
  if (!booking) throw new NotFoundError("Réservation introuvable");
  const isOwner =
    booking.patientId === userId || booking.nurse.userId === userId;
  if (!isOwner) throw new ForbiddenError();
  return booking;
}

/** GET /api/bookings/[id] */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const booking = await loadBookingForUser(id, session.sub);
    return ok({ booking });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * DELETE /api/bookings/[id] - annulation par le patient.
 * Règle: annulable seulement si > 2h avant le créneau et statut non terminal.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const booking = await loadBookingForUser(id, session.sub);

    if (booking.patientId !== session.sub) {
      throw new ForbiddenError("Seul le patient peut annuler");
    }
    const terminal = ["COMPLETED", "CANCELLED", "REFUSED", "EXPIRED"];
    if (terminal.includes(booking.status)) {
      throw new BadRequestError("Réservation non annulable");
    }
    const twoHours = 2 * 60 * 60 * 1000;
    if (booking.scheduledAt.getTime() - Date.now() < twoHours) {
      throw new BadRequestError(
        "Annulation impossible à moins de 2h du rendez-vous",
      );
    }

    const body = await req.json().catch(() => ({}));
    const { reason } = cancelBookingSchema.parse(body);

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
        ...(booking.payment && booking.payment.status === "PAID"
          ? { payment: { update: { status: "REFUNDED" } } }
          : {}),
      },
    });

    await notify({
      userId: booking.nurse.userId,
      type: "BOOKING_CANCELLED",
      title: "Réservation annulée",
      message: "Le patient a annulé une visite.",
      metadata: { bookingId: id },
    });

    return ok({ booking: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
