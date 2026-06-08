import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { created, ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { trigger, conversationChannel } from "@/lib/pusher";
import { z } from "zod";

async function participantOrThrow(conversationId: string, userId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!convo) throw new NotFoundError("Conversation introuvable");
  if (!convo.participants.some((p) => p.userId === userId)) throw new ForbiddenError();
  return convo;
}

/** GET — messages du fil (marque lu). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    await participantOrThrow(id, session.sub);

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: session.sub },
      data: { lastReadAt: new Date() },
    });
    return ok({ messages, meId: session.sub });
  } catch (err) {
    return handleApiError(err);
  }
}

const sendSchema = z.object({ body: z.string().min(1).max(2000) });

/** POST — envoie un message. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const convo = await participantOrThrow(id, session.sub);
    const { body } = sendSchema.parse(await req.json());

    const message = await prisma.message.create({
      data: { conversationId: id, senderId: session.sub, body },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
    await prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });

    const sender = message.sender;
    const others = convo.participants.filter((p) => p.userId !== session.sub);
    await Promise.all(
      others.map((p) =>
        notify({
          userId: p.userId,
          type: "GENERIC",
          title: `💬 ${sender.firstName} ${sender.lastName}`,
          message: body.slice(0, 120),
          metadata: { conversationId: id },
        }),
      ),
    );
    await trigger(conversationChannel(id), "message", { id: message.id });

    return created({ message });
  } catch (err) {
    return handleApiError(err);
  }
}
