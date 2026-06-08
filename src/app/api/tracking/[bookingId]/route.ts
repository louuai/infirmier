import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { nurseLocationSchema } from "@/lib/validations";
import { ForbiddenError, NotFoundError, handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { haversineKm } from "@/lib/geo";
import { trigger, bookingChannel } from "@/lib/pusher";

/** GET /api/tracking/[bookingId] — position de l'infirmier + distance/ETA. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const session = await requireSession(req);
    const { bookingId } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { nurse: { include: { user: { select: { firstName: true, lastName: true } } } }, trackingSession: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (booking.patientId !== session.sub && booking.nurse.userId !== session.sub) throw new ForbiddenError();

    const lat = booking.trackingSession?.lastLat ?? booking.nurse.currentLat;
    const lng = booking.trackingSession?.lastLng ?? booking.nurse.currentLng;
    let distanceKm: number | null = null;
    let etaMin: number | null = null;
    if (lat != null && lng != null && booking.latitude != null && booking.longitude != null) {
      distanceKm = Math.round(haversineKm(lat, lng, booking.latitude, booking.longitude) * 10) / 10;
      etaMin = Math.max(1, Math.round(distanceKm * 2));
    }

    return ok({
      status: booking.status,
      nurse: { name: `${booking.nurse.user.firstName} ${booking.nurse.user.lastName}`, lat, lng },
      destination: { lat: booking.latitude, lng: booking.longitude, address: booking.address },
      distanceKm,
      etaMin,
      active: booking.trackingSession?.active ?? false,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/tracking/[bookingId] — l'infirmier pousse sa position temps réel. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const session = await requireRole(req, "NURSE");
    const { bookingId } = await params;
    const loc = nurseLocationSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { nurse: true } });
    if (!booking) throw new NotFoundError("Réservation introuvable");
    if (booking.nurse.userId !== session.sub) throw new ForbiddenError();

    await prisma.$transaction([
      prisma.trackingSession.upsert({
        where: { bookingId },
        create: { bookingId, nurseId: booking.nurseId, active: true, lastLat: loc.latitude, lastLng: loc.longitude, lastUpdate: new Date() },
        update: { lastLat: loc.latitude, lastLng: loc.longitude, lastUpdate: new Date(), active: true },
      }),
      prisma.liveLocation.create({
        data: { nurseId: booking.nurseId, bookingId, latitude: loc.latitude, longitude: loc.longitude },
      }),
      prisma.nurseProfile.update({
        where: { id: booking.nurseId },
        data: { currentLat: loc.latitude, currentLng: loc.longitude, lastSeenAt: new Date() },
      }),
    ]);

    const distanceKm =
      booking.latitude != null && booking.longitude != null
        ? Math.round(haversineKm(loc.latitude, loc.longitude, booking.latitude, booking.longitude) * 10) / 10
        : null;
    await trigger(bookingChannel(bookingId), "location", {
      lat: loc.latitude,
      lng: loc.longitude,
      distanceKm,
      etaMin: distanceKm != null ? Math.max(1, Math.round(distanceKm * 2)) : null,
    });

    return ok({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
