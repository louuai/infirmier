import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { nurseProfileSchema, nurseLocationSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { nurseAccess, SUBSCRIPTION } from "@/lib/subscription";

/** GET /api/nurses/me — profil de l'infirmier connecté + état d'abonnement. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const nurse = await prisma.nurseProfile.findUnique({
      where: { userId: session.sub },
      include: { services: { include: { service: true } }, documents: true, availabilities: true },
    });
    return ok({ nurse, access: nurseAccess(nurse), subscription: SUBSCRIPTION });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/nurses/me — profil, disponibilité, services proposés, position. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const body = await req.json();

    // Mise à jour rapide de la position (tracking)
    if (body.location) {
      const loc = nurseLocationSchema.parse(body.location);
      const nurse = await prisma.nurseProfile.update({
        where: { userId: session.sub },
        data: { currentLat: loc.latitude, currentLng: loc.longitude, lastSeenAt: new Date() },
      });
      return ok({ nurse });
    }

    const data = nurseProfileSchema.parse(body.profile ?? body);
    const { serviceIds, ...profile } = data;

    const nurse = await prisma.nurseProfile.update({
      where: { userId: session.sub },
      data: {
        ...profile,
        ...(serviceIds
          ? {
              services: {
                deleteMany: {},
                create: serviceIds.map((serviceId) => ({ serviceId })),
              },
            }
          : {}),
      },
      include: { services: { include: { service: true } } },
    });
    return ok({ nurse });
  } catch (err) {
    return handleApiError(err);
  }
}
