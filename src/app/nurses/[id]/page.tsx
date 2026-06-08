import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Star, MapPin, Briefcase, ShieldCheck } from "lucide-react";
import { formatTND } from "@/lib/utils";
import { BookingForm } from "./booking-form";
import { VerifiedBadge } from "@/components/verified-badge";

export default async function NurseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { id } = await params;
  const { service: preselectedServiceId } = await searchParams;

  const nurse = await prisma.nurseProfile.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true } },
      services: { include: { service: true } },
      reviews: {
        orderBy: { createdAt: "desc" }, take: 20,
        include: { author: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  if (!nurse || nurse.verificationStatus !== "APPROVED") notFound();

  const services = nurse.services.map((s) => ({ id: s.service.id, name: s.service.name, price: s.service.price }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container grid gap-8 py-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl glass p-6 sm:flex-row sm:items-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-emerald-500/30 text-2xl font-bold text-white">
              {nurse.user.firstName[0]}{nurse.user.lastName[0]}
            </div>
            <div className="flex-1">
              <h1 className="flex items-center gap-1.5 text-2xl font-bold">{nurse.user.firstName} {nurse.user.lastName} <VerifiedBadge size={20} /></h1>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="size-4" /> {nurse.city ?? "—"}</span>
                <span className="flex items-center gap-1"><Briefcase className="size-4" /> {nurse.yearsOfExperience} ans</span>
                <span className="flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" /> {nurse.ratingAverage.toFixed(1)} ({nurse.ratingCount})</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300"><ShieldCheck className="size-4" /> Vérifié</span>
          </div>

          {nurse.bio && (
            <div className="rounded-2xl glass p-6">
              <h2 className="mb-2 font-semibold">À propos</h2>
              <p className="text-slate-400">{nurse.bio}</p>
            </div>
          )}

          <div className="rounded-2xl glass p-6">
            <h2 className="mb-3 font-semibold">Services proposés</h2>
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
                  <span className="text-slate-200">{s.name}</span>
                  <span className="font-semibold text-emerald-300">{formatTND(s.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl glass p-6">
            <h2 className="mb-3 font-semibold">Avis des patients</h2>
            <div className="space-y-4">
              {nurse.reviews.length === 0 ? (
                <p className="text-slate-500">Aucun avis pour le moment.</p>
              ) : nurse.reviews.map((r) => (
                <div key={r.id} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.author.firstName} {r.author.lastName[0]}.</span>
                    <span className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-slate-400">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl glass p-6">
            <h2 className="mb-1 text-lg font-semibold">Demander une visite</h2>
            <p className="mb-4 text-sm text-slate-400">Sans engagement — vous payez seulement après acceptation.</p>
            <BookingForm nurseId={nurse.id} services={services} preselectedServiceId={preselectedServiceId} />
          </div>
        </div>
      </div>
    </div>
  );
}
