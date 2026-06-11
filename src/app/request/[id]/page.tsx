"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTND } from "@/lib/utils";
import { Loader2, Star, MapPin, Briefcase, CreditCard, ShieldCheck } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  address: string;
  price: number;
  service: { name: string };
  nurse: { id: string; name: string; city: string | null; ratingAverage: number; ratingCount: number; yearsOfExperience: number; bio: string | null } | null;
}

export default function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    const b: Booking = data.data.booking;
    setBooking(b);
    if (["PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status)) {
      router.replace(`/track/${id}`);
    }
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

  async function pay() {
    setPaying(true); setError(null);
    const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id }) });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) { setError(data.error ?? "Erreur de paiement"); return; }
    if (data.redirectUrl) { window.location.href = data.redirectUrl; return; }
    router.replace(`/track/${id}`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container max-w-xl py-12">
        {!booking ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-400" /></div>
        ) : booking.status === "SEARCHING" ? (
          <div className="rounded-3xl glass p-10 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500/10">
              <Loader2 className="size-9 animate-spin text-emerald-300" />
            </div>
            <h1 className="text-2xl font-bold">Recherche d'un infirmier…</h1>
            <p className="mt-2 text-slate-400">Votre demande « {booking.service.name} » a été envoyée aux infirmiers disponibles autour de vous. Le premier qui accepte prendra la mission.</p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-slate-500">Veuillez patienter…</p>
          </div>
        ) : booking.status === "AWAITING_PAYMENT" && booking.nurse ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-emerald-200">
              <ShieldCheck className="mx-auto mb-1 size-6" /> Un infirmier a accepté votre demande !
            </div>
            <div className="rounded-2xl glass p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-emerald-500/30 text-xl font-bold text-white">
                  {booking.nurse.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{booking.nurse.name}</h2>
                  <p className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="size-4" /> {booking.nurse.city ?? "—"}</span>
                    <span className="flex items-center gap-1"><Briefcase className="size-4" /> {booking.nurse.yearsOfExperience} ans</span>
                    <span className="flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" /> {booking.nurse.ratingAverage.toFixed(1)} ({booking.nurse.ratingCount})</span>
                  </p>
                </div>
              </div>
              {booking.nurse.bio && <p className="mt-4 text-sm text-slate-400">{booking.nurse.bio}</p>}
            </div>
            <div className="rounded-2xl glass p-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{booking.service.name}</span>
                <span className="text-xl font-bold text-emerald-300">{formatTND(booking.price)}</span>
              </div>
              {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
              <button onClick={pay} disabled={paying} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3.5 font-semibold text-white disabled:opacity-50">
                {paying ? <Loader2 className="size-5 animate-spin" /> : <><CreditCard className="size-5" /> Accepter & Payer {formatTND(booking.price)}</>}
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">Paiement sécurisé. Vous suivrez ensuite l'infirmier en temps réel.</p>
            </div>
          </div>
        ) : booking.status === "COMPLETED" ? (
          <div className="rounded-3xl glass p-10 text-center"><h1 className="text-2xl font-bold">Mission terminée ✅</h1><p className="mt-2 text-slate-400">Merci d'avoir utilisé Infirmier Tunis.</p></div>
        ) : (
          <div className="rounded-3xl glass p-10 text-center">
            <h1 className="text-2xl font-bold">Demande {booking.status === "CANCELLED" ? "annulée" : booking.status === "REFUSED" ? "refusée" : "expirée"}</h1>
            <p className="mt-2 text-slate-400">Vous pouvez relancer une nouvelle demande.</p>
            <a href="/search" className="mt-6 inline-block rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 font-semibold text-white">Nouvelle demande</a>
          </div>
        )}
      </div>
    </div>
  );
}
