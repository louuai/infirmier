import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { haversineKm } from "@/lib/geo";

/**
 * GET /api/bookings/available — demandes en attente (SEARCHING) que cet infirmier
 * peut accepter : pour les services qu'il propose. Triées par proximité.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const nurse = await prisma.nurseProfile.findUnique({
      where: { userId: session.sub },
      include: { services: true },
    });
    if (!nurse) return ok({ items: [] });

    const serviceIds = nurse.services.map((s) => s.serviceId);
    if (serviceIds.length === 0) return ok({ items: [] });

    const bookings = await prisma.booking.findMany({
      where: { status: "SEARCHING", serviceId: { in: serviceIds } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { service: true },
    });

    const lat = nurse.currentLat ?? nurse.latitude;
    const lng = nurse.currentLng ?? nurse.longitude;
    const items = bookings.map((b) => {
      const distanceKm =
        lat != null && lng != null && b.latitude != null && b.longitude != null
          ? Math.round(haversineKm(lat, lng, b.latitude, b.longitude) * 10) / 10
          : null;
      return {
        id: b.id,
        service: { name: b.service.name },
        address: b.address,
        city: b.city,
        price: b.price,
        nurseAmount: b.nurseAmount,
        guestName: b.guestName,
        createdAt: b.createdAt,
        distanceKm,
      };
    });
    items.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

    return ok({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
