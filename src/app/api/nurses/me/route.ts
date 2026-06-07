import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { nurseProfileSchema, availabilitySchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";

/** GET /api/nurses/me - profil de l'infirmier connecté. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const nurse = await prisma.nurseProfile.findUnique({
      where: { userId: session.sub },
      include: { availabilities: true, documents: true },
    });
    return ok({ nurse });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/nurses/me - met à jour profil + disponibilités. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const body = await req.json();

    const profileData = nurseProfileSchema.parse(body.profile ?? {});
    let availabilities;
    if (body.availabilities) {
      availabilities = availabilitySchema.parse({
        availabilities: body.availabilities,
      }).availabilities;
    }

    const nurse = await prisma.nurseProfile.update({
      where: { userId: session.sub },
      data: {
        ...profileData,
        ...(availabilities
          ? {
              availabilities: {
                deleteMany: {},
                create: availabilities,
              },
            }
          : {}),
      },
      include: { availabilities: true },
    });

    return ok({ nurse });
  } catch (err) {
    return handleApiError(err);
  }
}
