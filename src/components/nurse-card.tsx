import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";
import { formatTND } from "@/lib/utils";

interface Props {
  nurse: {
    id: string;
    pricePerVisit: number;
    city: string | null;
    specialties: string[];
    ratingAverage: number;
    ratingCount: number;
    distanceKm?: number | null;
    user: { firstName: string; lastName: string };
  };
}

export function NurseCard({ nurse }: Props) {
  const initials = `${nurse.user.firstName[0] ?? ""}${nurse.user.lastName[0] ?? ""}`;
  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {nurse.user.firstName} {nurse.user.lastName}
            </p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {nurse.city ?? "—"}
              {nurse.distanceKm != null && (
                <span className="text-primary">· {nurse.distanceKm} km</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {nurse.specialties.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <strong>{nurse.ratingAverage.toFixed(1)}</strong>
            <span className="text-muted-foreground">({nurse.ratingCount})</span>
          </span>
          <span className="font-semibold text-primary">{formatTND(nurse.pricePerVisit)}</span>
        </div>

        <Link href={`/nurses/${nurse.id}`}>
          <Button className="w-full">Voir & réserver</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
