import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchNursesSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { boundingBox, haversineKm } from "@/lib/geo";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/nurses — recherche type Uber.
 * Filtre : infirmiers APPROVED + DISPONIBLES + proposant le service demandé,
 * autour de la position du client. Tri par distance puis note.
 */
export async function GET(req: NextRequest) {
  try {
    const q = searchNursesSchema.parse(Object.fromEntries(req.nextUrl.searchParams));

    const where: Prisma.NurseProfileWhereInput = {
      verificationStatus: "APPROVED",
      availability: "AVAILABLE",
    };
    if (q.serviceSlug) {
      where.services = { some: { service: { slug: q.serviceSlug } } };
    }

    const hasGeo = q.lat !== undefined && q.lng !== undefined;
    if (hasGeo) {
      const box = boundingBox(q.lat!, q.lng!, q.radiusKm);
      where.latitude = { gte: box.minLat, lte: box.maxLat };
      where.longitude = { gte: box.minLon, lte: box.maxLon };
    }

    const nurses = await prisma.nurseProfile.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        services: { include: { service: true } },
      },
      take: hasGeo ? 200 : q.pageSize * q.page,
    });

    let items = nurses.map((n) => {
      const lat = n.currentLat ?? n.latitude;
      const lng = n.currentLng ?? n.longitude;
      const distanceKm =
        hasGeo && lat != null && lng != null
          ? Math.round(haversineKm(q.lat!, q.lng!, lat, lng) * 10) / 10
          : null;
      return {
        id: n.id,
        bio: n.bio,
        city: n.city,
        latitude: lat,
        longitude: lng,
        yearsOfExperience: n.yearsOfExperience,
        ratingAverage: n.ratingAverage,
        ratingCount: n.ratingCount,
        availability: n.availability,
        user: n.user,
        services: n.services.map((s) => ({ slug: s.service.slug, name: s.service.name, price: s.service.price })),
        distanceKm,
        // temps estimé : ~2 min/km en ville
        etaMin: distanceKm != null ? Math.max(5, Math.round(distanceKm * 2)) : null,
      };
    });

    if (hasGeo) {
      items = items.filter((n) => n.distanceKm != null && n.distanceKm <= q.radiusKm)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || b.ratingAverage - a.ratingAverage);
    } else {
      items.sort((a, b) => b.ratingAverage - a.ratingAverage);
    }

    const total = items.length;
    const start = (q.page - 1) * q.pageSize;
    return ok({ items: items.slice(start, start + q.pageSize), total, page: q.page, pageSize: q.pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}
