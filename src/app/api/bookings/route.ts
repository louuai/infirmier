import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { BadRequestError, NotFoundError, UnauthorizedError, handleApiError } from "@/lib/errors";
import { created, ok } from "@/lib/api";
import { computeSplit } from "@/lib/config";
import { notify } from "@/lib/notifications";
import { trigger } from "@/lib/pusher";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createSchema = z.object({
  serviceId: z.string().min(1),
  scheduledAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
  address: z.string().min(3, "Adresse requise"),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  guestName: z.string().min(2).optional(),
  guestPhone: z.string().min(6).optional(),
  guestEmail: z.string().email().optional(),
});

/** GET /api/bookings — réservations de l'utilisateur connecté (patient ou infirmier assigné). */
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
 * POST /api/bookings — DISPATCH : le client (invité OU connecté) crée une demande
 * pour un SERVICE. La demande part en SEARCHING et est diffusée à TOUS les infirmiers
 * disponibles proposant ce service. Le premier qui accepte (claim) remporte la mission.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req); // peut être null (invité)
    const input = createSchema.parse(await req.json());

    if (!session && (!input.guestName || !input.guestPhone)) {
      throw new BadRequestError("Nom et téléphone requis pour une demande sans compte");
    }

    const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
    if (!service || !service.active) throw new NotFoundError("Service indisponible");

    const split = computeSplit(service.price);

    const booking = await prisma.booking.create({
      data: {
        patientId: session?.role === "PATIENT" ? session.sub : null,
        guestName: input.guestName,
        guestPhone: input.guestPhone,
        guestEmail: input.guestEmail,
        serviceId: service.id,
        status: "SEARCHING",
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

    // Diffusion à tous les infirmiers éligibles (validés + disponibles + proposant le service)
    const eligible = await prisma.nurseProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        availability: "AVAILABLE",
        services: { some: { serviceId: service.id } },
      },
      select: { id: true, userId: true },
    });

    await Promise.all(
      eligible.map((n) =>
        notify({
          userId: n.userId,
          type: "REQUEST_RECEIVED",
          title: "Nouvelle demande disponible",
          message: `${service.name} à ${input.address}. Premier à accepter !`,
          metadata: { bookingId: booking.id, dispatch: true },
        }),
      ),
    );
    await Promise.all(eligible.map((n) => trigger(`nurse-${n.id}`, "dispatch", { bookingId: booking.id })));

    logger.info({ bookingId: booking.id, eligible: eligible.length }, "Demande diffusée (dispatch)");
    return created({ booking, dispatchedTo: eligible.length });
  } catch (err) {
    return handleApiError(err);
  }
}
