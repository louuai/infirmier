import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ConflictError, ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { trigger, bookingChannel } from "@/lib/pusher";
import { nurseAccess } from "@/lib/subscription";

/**
 * POST /api/bookings/[id]/claim — un infirmier ACCEPTE une demande (dispatch).
 * Premier arrivé, premier servi (attribution atomique sur SEARCHING).
 * Nouveau modèle : pas de paiement en ligne. Le client paie SUR PLACE.
 * Accès réservé aux infirmiers avec abonnement actif ou essai en cours.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(req, "NURSE");
    const { id } = await params;

    const nurse = await prisma.nurseProfile.findUnique({ where: { userId: session.sub } });
    if (!nurse) throw new NotFoundError("Profil infirmier introuvable");
    if (nurse.verificationStatus !== "APPROVED") throw new ConflictError("Compte non validé");
    if (!nurseAccess(nurse).active) throw new ForbiddenError("Abonnement requis pour accepter des missions");

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundError("Demande introuvable");

    // Attribution atomique : ne réussit que si la demande est toujours SEARCHING
    const claim = await prisma.booking.updateMany({
      where: { id, status: "SEARCHING" },
      data: { nurseId: nurse.id, status: "ACCEPTED", acceptedAt: new Date() },
    });
    if (claim.count === 0) throw new ConflictError("Demande déjà prise par un autre infirmier");

    if (booking.patientId) {
      await notify({
        userId: booking.patientId,
        type: "REQUEST_ACCEPTED",
        title: "Infirmier en route ✅",
        message: "Un infirmier a accepté votre demande. Suivez son arrivée — paiement sur place.",
        metadata: { bookingId: id },
      });
    }
    await trigger(bookingChannel(id), "status", { status: "ACCEPTED" });

    const full = await prisma.booking.findUnique({
      where: { id },
      include: { service: true, nurse: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return ok({ booking: full });
  } catch (err) {
    return handleApiError(err);
  }
}
