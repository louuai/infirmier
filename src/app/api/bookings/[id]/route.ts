import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { cancelBookingSchema } from "@/lib/validations";
import { BadRequestError, ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";

/**
 * GET /api/bookings/[id] — accessible en INVITÉ via l'ID de réservation (lien magique).
 * Sert au client pour suivre l'état (SEARCHING → AWAITING_PAYMENT → PAID → …).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const b = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        nurse: { include: { user: { select: { firstName: true, lastName: true } } } },
        payment: true,
        invoice: true,
      },
    });
    if (!b) throw new NotFoundError("Réservation introuvable");
    return ok({
      booking: {
        id: b.id,
        status: b.status,
        address: b.address,
        price: b.price,
        commissionAmount: b.commissionAmount,
        nurseAmount: b.nurseAmount,
        service: { name: b.service.name },
        nurse: b.nurse
          ? {
              id: b.nurse.id,
              name: `${b.nurse.user.firstName} ${b.nurse.user.lastName}`,
              city: b.nurse.city,
              ratingAverage: b.nurse.ratingAverage,
              ratingCount: b.nurse.ratingCount,
              yearsOfExperience: b.nurse.yearsOfExperience,
              bio: b.nurse.bio,
            }
          : null,
        invoiceNumber: b.invoice?.number ?? null,
        paymentStatus: b.payment?.status ?? null,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/bookings/[id] — annulation par le patient connecté (avant EN_ROUTE). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw new ForbiddenError();
    const { id } = await params;
    const b = await prisma.booking.findUnique({ where: { id }, include: { nurse: true, payment: true } });
    if (!b) throw new NotFoundError("Réservation introuvable");
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
    if (b.nurse) {
      await notify({
        userId: b.nurse.userId,
        type: "GENERIC",
        title: "Réservation annulée",
        message: "Le client a annulé la demande.",
        metadata: { bookingId: id },
      });
    }
    return ok({ booking: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
