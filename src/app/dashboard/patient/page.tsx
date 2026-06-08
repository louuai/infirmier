"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatTND } from "@/lib/utils";
import { Loader2, CreditCard, MapPin, Star } from "lucide-react";

interface Booking {
  id: string; status: string; address: string; price: number; createdAt: string;
  service: { name: string };
  nurse: { user: { firstName: string; lastName: string } };
  invoice: { number: string } | null;
  review: { id: string } | null;
}

const LABEL: Record<string, { t: string; c: string }> = {
  REQUESTED: { t: "En attente infirmier", c: "bg-amber-500/20 text-amber-300" },
  REFUSED: { t: "Refusée", c: "bg-rose-500/20 text-rose-300" },
  AWAITING_PAYMENT: { t: "À payer", c: "bg-amber-500/20 text-amber-300" },
  PAID: { t: "Payée", c: "bg-sky-500/20 text-sky-300" },
  EN_ROUTE: { t: "En route", c: "bg-emerald-500/20 text-emerald-300" },
  ARRIVED: { t: "Arrivé", c: "bg-emerald-500/20 text-emerald-300" },
  IN_PROGRESS: { t: "En cours", c: "bg-sky-500/20 text-sky-300" },
  COMPLETED: { t: "Terminée", c: "bg-emerald-500/20 text-emerald-300" },
  CANCELLED: { t: "Annulée", c: "bg-slate-500/20 text-slate-300" },
  EXPIRED: { t: "Expirée", c: "bg-slate-500/20 text-slate-300" },
};

export default function PatientDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.data?.bookings ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function pay(id: string) {
    setPaying(id);
    const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id }) });
    const data = await res.json();
    setPaying(null);
    if (!res.ok) { alert(data.error); return; }
    if (data.redirectUrl) { window.location.href = data.redirectUrl; return; }
    load();
  }

  async function cancel(id: string) {
    if (!confirm("Annuler cette réservation ?")) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Annulé par le client" }) });
    if (!res.ok) alert((await res.json()).error);
    load();
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mes réservations</h1>
          <Link href="/search" className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white">Nouvelle demande</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-slate-500"><Loader2 className="animate-spin" /></div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl glass py-16 text-center text-slate-400">
            Aucune réservation. <Link href="/search" className="text-sky-400">Trouvez un infirmier →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const s = LABEL[b.status] ?? { t: b.status, c: "bg-slate-500/20 text-slate-300" };
              return (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl glass p-5">
                  <div>
                    <p className="font-semibold">{b.service.name}</p>
                    <p className="text-sm text-slate-400">avec {b.nurse.user.firstName} {b.nurse.user.lastName} · {formatDate(b.createdAt)}</p>
                    <p className="text-sm text-slate-500">{b.address}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-emerald-300">{formatTND(b.price)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.c}`}>{s.t}</span>
                    <Link href={`/invoices/${b.id}`} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10">Facture</Link>
                    {b.status === "AWAITING_PAYMENT" && (
                      <button onClick={() => pay(b.id)} disabled={paying === b.id} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                        <CreditCard className="size-4" /> {paying === b.id ? "..." : "Payer"}
                      </button>
                    )}
                    {["PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(b.status) && (
                      <Link href={`/messages?booking=${b.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10">Chat</Link>
                    )}
                    {["EN_ROUTE", "ARRIVED"].includes(b.status) && (
                      <Link href={`/track/${b.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-4 py-1.5 text-sm font-semibold text-emerald-300">
                        <MapPin className="size-4" /> Suivre
                      </Link>
                    )}
                    {["REQUESTED", "AWAITING_PAYMENT", "PAID"].includes(b.status) && (
                      <button onClick={() => cancel(b.id)} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white hover:bg-white/10">Annuler</button>
                    )}
                    {b.status === "COMPLETED" && !b.review && <ReviewButton bookingId={b.id} onDone={load} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewButton({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  async function submit() {
    await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, rating, comment }) });
    setOpen(false); onDone();
  }
  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-semibold text-amber-300"><Star className="size-4" /> Avis</button>;
  return (
    <div className="flex items-center gap-2">
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="h-9 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white">
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n} className="bg-[#0b1220]">{n} ★</option>)}
      </select>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Commentaire" className="h-9 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white" />
      <button onClick={submit} className="rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white">Envoyer</button>
    </div>
  );
}
