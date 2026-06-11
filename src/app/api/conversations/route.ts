import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { BadRequestError, ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { created, ok } from "@/lib/api";
import { z } from "zod";

/** GET /api/conversations — fils de discussion de l'utilisateur. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const convos = await prisma.conversation.findMany({
      where: { participants: { some: { userId: session.sub } } },
      orderBy: { lastMessageAt: "desc" },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        booking: { select: { id: true, service: { select: { name: true } } } },
      },
    });

    const items = await Promise.all(
      convos.map(async (c) => {
        const me = c.participants.find((p) => p.userId === session.sub);
        const other = c.participants.find((p) => p.userId !== session.sub)?.user;
        const unread = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: session.sub },
            ...(me?.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}),
          },
        });
        return {
          id: c.id,
          kind: c.kind,
          bookingId: c.bookingId,
          bookingService: c.booking?.service?.name ?? null,
          other: other ? { name: `${other.firstName} ${other.lastName}`, role: other.role } : null,
          lastMessage: c.messages[0]?.body ?? null,
          lastMessageAt: c.lastMessageAt,
          unread,
        };
      }),
    );
    return ok({ conversations: items });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  target: z.enum(["admin"]).optional(),
  bookingId: z.string().optional(),
});

/** POST /api/conversations — ouvre (ou retrouve) un fil. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { target, bookingId } = createSchema.parse(await req.json());

    // Infirmier ↔ Admin
    if (target === "admin") {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (!admin) throw new NotFoundError("Aucun administrateur");
      const existing = await prisma.conversation.findFirst({
        where: {
          kind: "ADMIN_NURSE",
          AND: [
            { participants: { some: { userId: session.sub } } },
            { participants: { some: { userId: admin.id } } },
          ],
        },
      });
      if (existing) return ok({ conversationId: existing.id });
      const convo = await prisma.conversation.create({
        data: {
          kind: "ADMIN_NURSE",
          participants: { create: [{ userId: session.sub }, { userId: admin.id }] },
        },
      });
      return created({ conversationId: convo.id });
    }

    // Client ↔ Infirmier (après paiement uniquement)
    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { nurse: true } });
      if (!booking) throw new NotFoundError("Réservation introuvable");
      if (!booking.nurseId || !booking.nurse) throw new BadRequestError("Aucun infirmier assigné");
      const isParticipant = booking.patientId === session.sub || booking.nurse.userId === session.sub;
      if (!isParticipant) throw new ForbiddenError();
      if (!["PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(booking.status)) {
        throw new BadRequestError("Le chat s'ouvre après confirmation et paiement");
      }
      if (!booking.patientId) throw new BadRequestError("Client non enregistré");

      const existing = await prisma.conversation.findUnique({ where: { bookingId } });
      if (existing) return ok({ conversationId: existing.id });
      const convo = await prisma.conversation.create({
        data: {
          kind: "CLIENT_NURSE",
          bookingId,
          participants: { create: [{ userId: booking.patientId }, { userId: booking.nurse.userId }] },
        },
      });
      return created({ conversationId: convo.id });
    }

    throw new BadRequestError("Paramètres manquants");
  } catch (err) {
    return handleApiError(err);
  }
}
