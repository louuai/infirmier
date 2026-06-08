import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";

/** GET /api/notifications — notifications de l'utilisateur (récentes). */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const notifications = await prisma.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok({ notifications });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/notifications — marque tout comme lu. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession(req);
    await prisma.notification.updateMany({ where: { userId: session.sub, read: false }, data: { read: true } });
    return ok({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
