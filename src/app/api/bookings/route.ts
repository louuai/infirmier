import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createBookingSchema } from "@/lib/validations";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  handleApiError,
} from "@/lib/errors";
import { created, ok } from "@/lib/api";
import { computeSplit } from "@/lib/config";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";

/** GET /api/bookings - liste les réservations de l'utilisateur (patient ou infirmier). */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);

    const where =
      session.role === "NURSE"
        ? { nurse: { userId: session.sub } }
        : { patientId: session.sub };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      include: {
        nurse: { include: { user: { select: { firstName: true, lastName: true } } } },
        patient: { select: { firstName: true, lastName: true, phone: true } },
        payment: true,
        review: true,
      },
    });
    return ok({ bookings });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/bookings - un patient crée une réservation. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (session.role !== "PATIENT") {
      throw new ForbiddenError("Seuls les patients peuvent réserver");
    }

    const input = createBookingSchema.parse(await req.json());

    const nurse = await prisma.nurseProfile.findUnique({
      where: { id: input.nurseId },
    });
    if (!nurse || nurse.verificationStatus !== "APPROVED") {
      throw new NotFoundError("Infirmier indisponible");
    }
    if (nurse.pricePerVisit <= 0) {
      throw new BadRequestError("Tarif de l'infirmier non défini");
    }

    const split = computeSplit(nurse.pricePerVisit);

    const booking = await prisma.booking.create({
      data: {
        patientId: session.sub,
        nurseId: nurse.id,
        scheduledAt: input.scheduledAt,
        serviceType: input.serviceType,
        notes: input.notes,
        address: input.address,
        city: input.city,
        latitude: input.latitude,
        longitude: input.longitude,
        price: nurse.pricePerVisit,
        commissionRate: split.commissionRate,
        commissionAmount: split.commissionAmount,
        nurseAmount: split.nurseAmount,
        payment: {
          create: {
            amount: nurse.pricePerVisit,
            status: "PENDING",
          },
        },
      },
      include: { payment: true },
    });

    await notify({
      userId: nurse.userId,
      type: "BOOKING_CREATED",
      title: "Nouvelle demande de réservation",
      message: `Une visite "${input.serviceType}" est demandée.`,
      metadata: { bookingId: booking.id },
    });

    logger.info({ bookingId: booking.id }, "Réservation créée");
    return created({ booking });
  } catch (err) {
    return handleApiError(err);
  }
}
