"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTND } from "@/lib/utils";
import { Loader2, Star, MapPin, Briefcase, CreditCard, ShieldCheck, Lock } from "lucide-react";

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
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });

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

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  async function pay() {
    setError(null);
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 12) { setError("Numéro de carte invalide"); return; }
    if (!card.name.trim()) { setError("Nom sur la carte requis"); return; }
    if (!/^\d{2}\/\d{2}$/.test(card.exp)) { setError("Date d'expiration invalide (MM/AA)"); return; }
    if (card.cvc.replace(/\D/g, "").length < 3) { setError("CVC invalide"); return; }

    setPaying(true);
    const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erreur de paiement"); setPaying(false); return; }
    if (data.redirectUrl) { window.location.href = data.redirectUrl; return; }
    router.replace(`/track/${id}`);
  }

  const inputCls = "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-500 outline-none focus:border-sky-400/60";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container max-w-xl py-12">
        {!booking ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-400" /></div>
        ) : booking.status === "SEARCHING" ? (
          <div className="rounded-3xl glass p-10 text-center">
            <div className="pulse-ring relative mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-500/10">
              <Loader2 className="size-10 animate-spin text-emerald-300" />
            </div>
            <h1 className="text-2xl font-bold">Recherche d'un infirmier…</h1>
            <p className="mt-2 text-slate-400">Votre demande « {booking.service.name} » a été envoyée aux infirmiers disponibles autour de vous. Le premier qui accepte prendra la mission.</p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-slate-500">Veuillez patienter…</p>
          </div>
        ) : booking.status === "AWAITING_PAYMENT" && booking.nurse ? (
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
              <ShieldCheck className="size-6" /> Un infirmier a accepté votre demande !
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
            </div>

            {/* Paiement par carte */}
            <div className="rounded-2xl glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold"><CreditCard className="size-5 text-sky-400" /> Paiement</span>
                <span className="text-xl font-bold text-emerald-300">{formatTND(booking.price)}</span>
              </div>
              <div className="space-y-3">
                <input className={inputCls} inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} placeholder="Numéro de carte" />
                <input className={inputCls} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Nom sur la carte" />
                <div className="flex gap-3">
                  <input className={inputCls} inputMode="numeric" value={card.exp} onChange={(e) => setCard({ ...card, exp: formatExp(e.target.value) })} placeholder="MM/AA" />
                  <input className={inputCls} inputMode="numeric" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="CVC" />
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
              <button onClick={pay} disabled={paying} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3.5 font-semibold text-white disabled:opacity-50">
                {paying ? <Loader2 className="size-5 animate-spin" /> : <><Lock className="size-4" /> Payer {formatTND(booking.price)}</>}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-slate-500"><Lock className="size-3" /> Paiement chiffré · vous suivrez ensuite l'infirmier en direct</p>
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
