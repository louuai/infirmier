import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Briefcase } from "lucide-react";
import { formatTND } from "@/lib/utils";
import { BookingForm } from "./booking-form";

const DAYS: Record<string, string> = {
  MONDAY: "Lundi", TUESDAY: "Mardi", WEDNESDAY: "Mercredi", THURSDAY: "Jeudi",
  FRIDAY: "Vendredi", SATURDAY: "Samedi", SUNDAY: "Dimanche",
};

export default async function NurseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nurse = await prisma.nurseProfile.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true } },
      availabilities: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!nurse || nurse.verificationStatus !== "APPROVED") notFound();

  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        {/* En-tête */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {nurse.user.firstName[0]}
              {nurse.user.lastName[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {nurse.user.firstName} {nurse.user.lastName}
              </h1>
              <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" /> {nurse.city ?? "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="size-4" /> {nurse.yearsOfExperience} ans d'exp.
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  {nurse.ratingAverage.toFixed(1)} ({nurse.ratingCount})
                </span>
              </p>
            </div>
            <Badge variant="success">Vérifié</Badge>
          </CardContent>
        </Card>

        {nurse.bio && (
          <Card>
            <CardHeader><CardTitle>À propos</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">{nurse.bio}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Spécialités</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {nurse.specialties.map((s) => (
              <Badge key={s} variant="outline">{s}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Disponibilités</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {nurse.availabilities.length === 0 ? (
              <p className="text-muted-foreground">Non précisées.</p>
            ) : (
              nurse.availabilities.map((a) => (
                <div key={a.id} className="flex justify-between border-b py-1 last:border-0">
                  <span>{DAYS[a.dayOfWeek]}</span>
                  <span className="text-muted-foreground">{a.startTime} – {a.endTime}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Avis des patients</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {nurse.reviews.length === 0 ? (
              <p className="text-muted-foreground">Aucun avis pour le moment.</p>
            ) : (
              nurse.reviews.map((r) => (
                <div key={r.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.author.firstName} {r.author.lastName[0]}.</span>
                    <span className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Carte de réservation */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between">
              <span>Réserver une visite</span>
              <span className="text-primary">{formatTND(nurse.pricePerVisit)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BookingForm nurseId={nurse.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
