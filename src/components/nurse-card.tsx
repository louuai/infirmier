import Link from "next/link";
import { Star, MapPin, Clock, ArrowRight } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import { formatTND } from "@/lib/utils";

interface Props {
  nurse: {
    id: string;
    city: string | null;
    yearsOfExperience: number;
    ratingAverage: number;
    ratingCount: number;
    distanceKm?: number | null;
    etaMin?: number | null;
    user: { firstName: string; lastName: string };
  };
  serviceId?: string;
  servicePrice?: number;
}

export function NurseCard({ nurse, serviceId, servicePrice }: Props) {
  const initials = `${nurse.user.firstName[0] ?? ""}${nurse.user.lastName[0] ?? ""}`;
  const href = serviceId ? `/nurses/${nurse.id}?service=${serviceId}` : `/nurses/${nurse.id}`;
  return (
    <div className="group relative overflow-hidden rounded-2xl glass p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/40 hover:shadow-[0_20px_60px_-25px_rgba(16,185,129,0.6)]">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-emerald-500/30 font-semibold text-white ring-1 ring-white/10">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-semibold text-white">
            {nurse.user.firstName} {nurse.user.lastName} <VerifiedBadge size={15} />
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-400">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {nurse.city ?? "—"}</span>
            {nurse.distanceKm != null && <span className="text-sky-400">· {nurse.distanceKm} km</span>}
            {nurse.etaMin != null && (
              <span className="flex items-center gap-1 text-emerald-300"><Clock className="size-3.5" /> ~{nurse.etaMin} min</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm text-slate-200">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <strong>{nurse.ratingAverage.toFixed(1)}</strong>
          <span className="text-slate-500">({nurse.ratingCount})</span>
          <span className="ml-2 text-slate-500">{nurse.yearsOfExperience} ans</span>
        </span>
        {servicePrice != null && <span className="font-semibold text-emerald-300">{formatTND(servicePrice)}</span>}
      </div>

      <Link
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-transform group-hover:scale-[1.02]"
      >
        Choisir <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
