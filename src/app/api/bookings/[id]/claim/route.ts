import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ConflictError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { trigger, bookingChannel } from "@/lib/pusher";

/**
 * POST /api/bookings/[id]/claim — un infirmier ACCEPTE une demande en dispatch.
 * Premier arrivé, premier servi : l'attribution est atomique (updateMany sur SEARCHING).
 * À l'acceptation : facture générée, statut AWAITING_PAYMENT, le client est notifié.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(req, "NURSE");
    const { id } = await params;

    const nurse = await prisma.nurseProfile.findUnique({ where: { userId: session.sub } });
    if (!nurse) throw new NotFoundError("Profil infirmier introuvable");
    if (nurse.verificationStatus !== "APPROVED") throw new ConflictError("Compte non validé");

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundError("Demande introuvable");

    // Attribution atomique : ne réussit que si la demande est toujours SEARCHING
    const claim = await prisma.booking.updateMany({
      where: { id, status: "SEARCHING" },
      data: { nurseId: nurse.id, status: "AWAITING_PAYMENT", acceptedAt: new Date() },
    });
    if (claim.count === 0) throw new ConflictError("Demande déjà prise par un autre infirmier");

    // Facture
    const count = await prisma.invoice.count();
    await prisma.invoice.upsert({
      where: { bookingId: id },
      create: {
        bookingId: id,
        nurseId: nurse.id,
        number: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`,
        amount: booking.price,
        commission: booking.commissionAmount,
        nurseAmount: booking.nurseAmount,
        status: "ISSUED",
      },
      update: {},
    });

    if (booking.patientId) {
      await notify({
        userId: booking.patientId,
        type: "REQUEST_ACCEPTED",
        title: "Infirmier trouvé ✅",
        message: "Un infirmier a accepté votre demande. Procédez au paiement.",
        metadata: { bookingId: id },
      });
    }
    await trigger(bookingChannel(id), "status", { status: "AWAITING_PAYMENT" });

    const full = await prisma.booking.findUnique({
      where: { id },
      include: { service: true, nurse: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return ok({ booking: full });
  } catch (err) {
    return handleApiError(err);
  }
}
