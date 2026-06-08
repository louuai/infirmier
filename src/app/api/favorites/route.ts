import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { z } from "zod";

/** GET /api/favorites — infirmiers favoris du client. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.sub },
      include: { nurse: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return ok({ favorites });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/favorites — ajoute/retire un favori (toggle). */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { nurseId } = z.object({ nurseId: z.string().min(1) }).parse(await req.json());
    const existing = await prisma.favorite.findUnique({
      where: { userId_nurseId: { userId: session.sub, nurseId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return ok({ favorited: false });
    }
    await prisma.favorite.create({ data: { userId: session.sub, nurseId } });
    return ok({ favorited: true });
  } catch (err) {
    return handleApiError(err);
  }
}
