import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createReviewSchema } from "@/lib/validations";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  handleApiError,
} from "@/lib/errors";
import { created } from "@/lib/api";
import { notify } from "@/lib/notifications";

/** POST /api/reviews - le patient laisse un avis sur une visite terminée. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const input = createReviewSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { review: true, nurse: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (booking.patientId !== session.sub) throw new ForbiddenError();
    if (booking.status !== "COMPLETED") {
      throw new BadRequestError("La visite doit être terminée");
    }
    if (booking.review) throw new BadRequestError("Avis déjà laissé");

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          bookingId: booking.id,
          authorId: session.sub,
          nurseId: booking.nurseId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      // Recalcul de la moyenne dénormalisée.
      const agg = await tx.review.aggregate({
        where: { nurseId: booking.nurseId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.nurseProfile.update({
        where: { id: booking.nurseId },
        data: {
          ratingAverage: Math.round((agg._avg.rating ?? 0) * 10) / 10,
          ratingCount: agg._count,
        },
      });
      return r;
    });

    await notify({
      userId: booking.nurse.userId,
      type: "REVIEW_RECEIVED",
      title: "Nouvel avis reçu",
      message: `Vous avez reçu une note de ${input.rating}/5.`,
      metadata: { bookingId: booking.id },
    });

    return created({ review });
  } catch (err) {
    return handleApiError(err);
  }
}
