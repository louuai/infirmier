import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cancelBookingSchema } from "@/lib/validations";
import { BadRequestError, ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";

async function load(id: string) {
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      nurse: { include: { user: true } },
      patient: true,
      payment: true,
      invoice: true,
      trackingSession: true,
    },
  });
  if (!b) throw new NotFoundError("Réservation introuvable");
  return b;
}

/** GET /api/bookings/[id] */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const b = await load(id);
    const owner = b.patientId === session.sub || b.nurse.userId === session.sub;
    if (!owner) throw new ForbiddenError();
    return ok({ booking: b });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/bookings/[id] — annulation par le patient (avant EN_ROUTE). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const b = await load(id);
    if (b.patientId !== session.sub) throw new ForbiddenError("Seul le patient peut annuler");
    if (["EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUSED"].includes(b.status)) {
      throw new BadRequestError("Réservation non annulable à ce stade");
    }
    const { reason } = cancelBookingSchema.parse(await req.json().catch(() => ({})));
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
        ...(b.payment?.status === "PAID" ? { payment: { update: { status: "REFUNDED" } } } : {}),
      },
    });
    await notify({
      userId: b.nurse.userId,
      type: "GENERIC",
      title: "Réservation annulée",
      message: "Le client a annulé la demande.",
      metadata: { bookingId: id },
    });
    return ok({ booking: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
