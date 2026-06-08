import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, NotFoundError } from "@/lib/errors";
import { ok } from "@/lib/api";

/** GET /api/nurses/[id] — profil public + services + avis. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const nurse = await prisma.nurseProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        services: { include: { service: true } },
        availabilities: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { author: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!nurse || nurse.verificationStatus !== "APPROVED") {
      throw new NotFoundError("Infirmier introuvable");
    }
    return ok({ nurse });
  } catch (err) {
    return handleApiError(err);
  }
}
