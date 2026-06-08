import Link from "next/link";
import { Star, MapPin, ArrowRight } from "lucide-react";
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
    <div className="group relative overflow-hidden rounded-2xl glass p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/40 hover:shadow-[0_20px_60px_-25px_rgba(16,185,129,0.6)]">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-emerald-500/30 font-semibold text-white ring-1 ring-white/10">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {nurse.user.firstName} {nurse.user.lastName}
          </p>
          <p className="flex items-center gap-1 text-sm text-slate-400">
            <MapPin className="size-3.5" /> {nurse.city ?? "—"}
            {nurse.distanceKm != null && (
              <span className="text-sky-400">· {nurse.distanceKm} km</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {nurse.specialties.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm text-slate-200">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <strong>{nurse.ratingAverage.toFixed(1)}</strong>
          <span className="text-slate-500">({nurse.ratingCount})</span>
        </span>
        <span className="font-semibold text-emerald-300">{formatTND(nurse.pricePerVisit)}</span>
      </div>

      <Link
        href={`/nurses/${nurse.id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-transform group-hover:scale-[1.02]"
      >
        Voir & réserver <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
