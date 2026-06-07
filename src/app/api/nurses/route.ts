import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchNursesSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { boundingBox, haversineKm } from "@/lib/geo";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/nurses
 * Recherche d'infirmiers validés et disponibles.
 * Filtres: ville, géolocalisation (lat/lng + rayon), spécialité, prix max.
 * Tri par distance si coordonnées fournies.
 */
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const q = searchNursesSchema.parse(params);

    const where: Prisma.NurseProfileWhereInput = {
      verificationStatus: "APPROVED",
      isAvailable: true,
    };

    if (q.city) where.city = { contains: q.city, mode: "insensitive" };
    if (q.specialty) where.specialties = { has: q.specialty };
    if (q.maxPrice !== undefined) where.pricePerVisit = { lte: q.maxPrice };

    // Pré-filtrage géographique via bounding box (perf à grande échelle).
    const hasGeo = q.lat !== undefined && q.lng !== undefined;
    if (hasGeo) {
      const box = boundingBox(q.lat!, q.lng!, q.radiusKm);
      where.latitude = { gte: box.minLat, lte: box.maxLat };
      where.longitude = { gte: box.minLon, lte: box.maxLon };
    }

    let nurses = await prisma.nurseProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      take: hasGeo ? 200 : q.pageSize * q.page, // sur-récupère puis filtre distance
    });

    let withDistance = nurses.map((n) => ({
      ...n,
      distanceKm:
        hasGeo && n.latitude != null && n.longitude != null
          ? Math.round(haversineKm(q.lat!, q.lng!, n.latitude, n.longitude) * 10) /
            10
          : null,
    }));

    if (hasGeo) {
      withDistance = withDistance
        .filter((n) => n.distanceKm != null && n.distanceKm <= q.radiusKm)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else {
      withDistance.sort((a, b) => b.ratingAverage - a.ratingAverage);
    }

    const total = withDistance.length;
    const start = (q.page - 1) * q.pageSize;
    const items = withDistance.slice(start, start + q.pageSize);

    return ok({ items, total, page: q.page, pageSize: q.pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}
