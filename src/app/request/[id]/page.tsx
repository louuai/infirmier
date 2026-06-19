"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";

const CONFIRMED = ["ACCEPTED", "PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"];
const ENDED = ["CANCELLED", "REFUSED", "EXPIRED", "COMPLETED"];

export default function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<string>("SEARCHING");

  const fetchBooking = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    const b = data.data.booking;
    setStatus(b.status);
    if (CONFIRMED.includes(b.status)) router.replace(`/track/${id}`);
    else if (ENDED.includes(b.status)) router.replace("/");
  }, [id, router]);

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, 3000);
    let cleanup: (() => void) | undefined;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (key && cluster) {
      import("pusher-js").then(({ default: Pusher }) => {
        const p = new Pusher(key, { cluster });
        const ch = p.subscribe(`booking-${id}`);
        ch.bind("status", () => fetchBooking());
        cleanup = () => { p.unsubscribe(`booking-${id}`); p.disconnect(); };
      });
    }
    return () => { clearInterval(interval); cleanup?.(); };
  }, [id, fetchBooking]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container max-w-xl py-16">
        <div className="rounded-3xl glass p-10 text-center">
          <div className="pulse-ring relative mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-500/10">
            <Loader2 className="size-10 animate-spin text-emerald-300" />
          </div>
          <h1 className="text-2xl font-bold">Recherche d'un infirmier…</h1>
          <p className="mt-3 text-slate-400">
            Votre demande a été envoyée aux infirmiers disponibles autour de vous. Le premier qui accepte prend la mission — vous serez redirigé vers son suivi en temps réel.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <Wallet className="size-4 text-emerald-300" /> Paiement directement à l'infirmier, sur place.
          </p>
        </div>
      </div>
    </div>
  );
}
