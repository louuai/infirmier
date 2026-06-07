"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NurseCard } from "@/components/nurse-card";
import { Loader2, LocateFixed, Search } from "lucide-react";

const NursesMap = dynamic(() => import("@/components/nurses-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" />,
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
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Trouver un infirmier</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Colonne filtres + résultats */}
        <div>
          <div className="mb-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tunis, Sfax..." />
            </div>
            <div>
              <Label htmlFor="specialty">Spécialité</Label>
              <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Pansement..." />
            </div>
            {coords && (
              <div className="sm:col-span-2">
                <Label htmlFor="radius">Rayon : {radius} km</Label>
                <input
                  id="radius"
                  type="range"
                  min={1}
                  max={50}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </div>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={fetchNurses} className="flex-1">
                <Search /> Rechercher
              </Button>
              <Button variant="outline" onClick={useMyLocation}>
                <LocateFixed /> Autour de moi
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          ) : nurses.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">
              Aucun infirmier trouvé. Élargissez votre recherche.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {nurses.map((n) => (
                <NurseCard key={n.id} nurse={n} />
              ))}
            </div>
          )}
        </div>

        {/* Carte */}
        <div className="sticky top-20 h-[600px]">
          <NursesMap center={mapCenter} radiusKm={coords ? radius : undefined} nurses={nurses} />
        </div>
      </div>
    </div>
  );
}
