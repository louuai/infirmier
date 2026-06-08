import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { createBookingSchema } from "@/lib/validations";
import { BadRequestError, NotFoundError, UnauthorizedError, handleApiError } from "@/lib/errors";
import { created, ok } from "@/lib/api";
import { computeSplit } from "@/lib/config";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";

/** GET /api/bookings — réservations de l'utilisateur connecté (patient ou infirmier). */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw new UnauthorizedError();
    const where =
      session.role === "NURSE" ? { nurse: { userId: session.sub } } : { patientId: session.sub };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        service: true,
        nurse: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        patient: { select: { firstName: true, lastName: true, phone: true } },
        payment: true,
        invoice: true,
        review: true,
      },
    });
    return ok({ bookings });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/bookings — un client (connecté OU invité) envoie une demande.
 * Le paiement n'intervient qu'APRÈS acceptation par l'infirmier.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req); // peut être null (invité)
    const input = createBookingSchema.parse(await req.json());

    if (!session && (!input.guestName || !input.guestPhone)) {
      throw new BadRequestError("Nom et téléphone requis pour une demande sans compte");
    }

    const [nurse, service] = await Promise.all([
      prisma.nurseProfile.findUnique({ where: { id: input.nurseId } }),
      prisma.service.findUnique({ where: { id: input.serviceId } }),
    ]);
    if (!nurse || nurse.verificationStatus !== "APPROVED") throw new NotFoundError("Infirmier indisponible");
    if (!service || !service.active) throw new NotFoundError("Service indisponible");

    const split = computeSplit(service.price);

    const booking = await prisma.booking.create({
      data: {
        patientId: session?.role === "PATIENT" ? session.sub : null,
        guestName: input.guestName,
        guestPhone: input.guestPhone,
        guestEmail: input.guestEmail,
        nurseId: nurse.id,
        serviceId: service.id,
        status: "REQUESTED",
        scheduledAt: input.scheduledAt,
        notes: input.notes,
        address: input.address,
        city: input.city,
        latitude: input.latitude,
        longitude: input.longitude,
        price: service.price,
        commissionRate: split.commissionRate,
        commissionAmount: split.commissionAmount,
        nurseAmount: split.nurseAmount,
      },
    });

    await notify({
      userId: nurse.userId,
      type: "REQUEST_RECEIVED",
      title: "Nouvelle demande",
      message: `Demande "${service.name}" à ${input.address}.`,
      metadata: { bookingId: booking.id },
    });

    logger.info({ bookingId: booking.id }, "Demande créée");
    return created({ booking });
  } catch (err) {
    return handleApiError(err);
  }
}
