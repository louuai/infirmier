"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { Navigation, Clock, Loader2 } from "lucide-react";

const TrackMap = dynamic(() => import("@/components/track-map"), { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-white/5" /> });

interface TrackData {
  status: string;
  nurse: { name: string; lat: number | null; lng: number | null };
  destination: { lat: number | null; lng: number | null; address: string };
  distanceKm: number | null;
  etaMin: number | null;
}

export default function TrackPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const [data, setData] = useState<TrackData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/tracking/${bookingId}`);
    if (!res.ok) { setErr((await res.json()).error ?? "Erreur"); return; }
    setData((await res.json()).data);
  }, [bookingId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    // Temps réel via Pusher si configuré
    let cleanup: (() => void) | undefined;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (key && cluster) {
      import("pusher-js").then(({ default: Pusher }) => {
        const p = new Pusher(key, { cluster });
        const ch = p.subscribe(`booking-${bookingId}`);
        ch.bind("location", () => fetchData());
        ch.bind("status", () => fetchData());
        cleanup = () => { p.unsubscribe(`booking-${bookingId}`); p.disconnect(); };
      });
    }
    return () => { clearInterval(interval); cleanup?.(); };
  }, [bookingId, fetchData]);

  const nurse = data?.nurse.lat != null && data?.nurse.lng != null ? [data.nurse.lat, data.nurse.lng] as [number, number] : null;
  const dest = data?.destination.lat != null && data?.destination.lng != null ? [data.destination.lat, data.destination.lng] as [number, number] : null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="absolute inset-0">
        {data ? <TrackMap nurse={nurse} dest={dest} nurseName={data?.nurse.name} /> : (
          <div className="flex h-full items-center justify-center text-slate-500">{err ? err : <Loader2 className="animate-spin" />}</div>
        )}
      </div>

      {data && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl glass p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">/ SUIVI EN DIRECT</p>
            <h2 className="mt-1 text-xl font-bold">{data.nurse.name}</h2>
            <p className="text-sm text-slate-400">{data.destination.address}</p>
            <div className="mt-4 flex gap-6">
              <div className="flex items-center gap-2"><Navigation className="size-5 text-emerald-300" /><div><p className="text-lg font-bold">{data.distanceKm != null ? `${data.distanceKm} km` : "—"}</p><p className="text-xs text-slate-500">distance</p></div></div>
              <div className="flex items-center gap-2"><Clock className="size-5 text-sky-300" /><div><p className="text-lg font-bold">{data.etaMin != null ? `~${data.etaMin} min` : "—"}</p><p className="text-xs text-slate-500">arrivée estimée</p></div></div>
              <div className="ml-auto self-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">{data.status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
