"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { NurseCard } from "@/components/nurse-card";
import { Loader2, LocateFixed, Search, SlidersHorizontal } from "lucide-react";

const NursesMap = dynamic(() => import("@/components/nurses-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />,
});

interface Nurse {
  id: string;
  pricePerVisit: number;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  specialties: string[];
  ratingAverage: number;
  ratingCount: number;
  distanceKm?: number | null;
  user: { firstName: string; lastName: string };
}

const TUNIS: [number, number] = [36.8065, 10.1815];
const inputCls =
  "h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/20";

export default function SearchPage() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(20);

  const fetchNurses = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (specialty) q.set("specialty", specialty);
    if (coords) {
      q.set("lat", String(coords[0]));
      q.set("lng", String(coords[1]));
      q.set("radiusKm", String(radius));
    }
    const res = await fetch(`/api/nurses?${q.toString()}`);
    const data = await res.json();
    setNurses(data.data?.items ?? []);
    setLoading(false);
  }, [city, specialty, coords, radius]);

  useEffect(() => {
    fetchNurses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords([pos.coords.latitude, pos.coords.longitude]),
      () => alert("Géolocalisation refusée. Recherchez par ville."),
    );
  }

  const mapCenter = coords ?? TUNIS;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container py-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">/ RECHERCHE GÉOLOCALISÉE</p>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">
          Trouver un <span className="gradient-text">infirmier</span>
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Filtres + résultats */}
          <div>
            <div className="mb-5 rounded-2xl glass p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <SlidersHorizontal className="size-4 text-sky-400" /> Filtres
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Ville</label>
                  <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tunis, Sfax..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Spécialité</label>
                  <input className={inputCls} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Pansement..." />
                </div>
                {coords && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-slate-400">Rayon : {radius} km</label>
                    <input type="range" min={1} max={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-emerald-400" />
                  </div>
                )}
                <div className="flex gap-2 sm:col-span-2">
                  <button onClick={fetchNurses} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
                    <Search className="size-4" /> Rechercher
                  </button>
                  <button onClick={useMyLocation} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10">
                    <LocateFixed className="size-4" /> Autour de moi
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 text-slate-500"><Loader2 className="animate-spin" /></div>
            ) : nurses.length === 0 ? (
              <p className="py-20 text-center text-slate-500">Aucun infirmier trouvé. Élargissez votre recherche.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {nurses.map((n) => <NurseCard key={n.id} nurse={n} />)}
              </div>
            )}
          </div>

          {/* Carte */}
          <div className="sticky top-20 h-[600px] overflow-hidden rounded-2xl border border-white/10">
            <NursesMap center={mapCenter} radiusKm={coords ? radius : undefined} nurses={nurses} />
          </div>
        </div>
      </div>
    </div>
  );
}
