import { prisma } from "@/lib/prisma";
import type { NotificationType, Prisma } from "@prisma/client";

/** Crée une notification pour un utilisateur. */
export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
    },
  });
}
