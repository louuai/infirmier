"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTND } from "@/lib/utils";
import Link from "next/link";

interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  serviceType: string;
  address: string;
  price: number;
  nurse: { user: { firstName: string; lastName: string } };
  review: { id: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  PENDING_NURSE: { label: "En attente infirmier", variant: "warning" },
  ACCEPTED: { label: "Acceptée", variant: "default" },
  REFUSED: { label: "Refusée", variant: "destructive" },
  IN_PROGRESS: { label: "En cours", variant: "default" },
  COMPLETED: { label: "Terminée", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "outline" },
  EXPIRED: { label: "Expirée", variant: "outline" },
};

export default function PatientDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.data?.bookings ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function cancel(id: string) {
    if (!confirm("Annuler cette réservation ?")) return;
    const res = await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Annulé par le patient" }),
    });
    if (!res.ok) alert((await res.json()).error);
    load();
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes réservations</h1>
        <Link href="/search"><Button>Nouvelle réservation</Button></Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : bookings.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          Aucune réservation. <Link href="/search" className="text-primary">Trouvez un infirmier →</Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const s = STATUS_LABEL[b.status] ?? { label: b.status, variant: "outline" };
            const cancellable = ["PENDING_NURSE", "ACCEPTED"].includes(b.status);
            return (
              <Card key={b.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold">{b.serviceType}</p>
                    <p className="text-sm text-muted-foreground">
                      avec {b.nurse.user.firstName} {b.nurse.user.lastName} · {formatDate(b.scheduledAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">{b.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{formatTND(b.price)}</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                    {cancellable && (
                      <Button variant="outline" size="sm" onClick={() => cancel(b.id)}>Annuler</Button>
                    )}
                    {b.status === "COMPLETED" && !b.review && (
                      <ReviewButton bookingId={b.id} onDone={load} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewButton({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function submit() {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, rating, comment }),
    });
    setOpen(false);
    onDone();
  }

  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>Laisser un avis</Button>;
  return (
    <div className="flex items-center gap-2">
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="h-9 rounded-md border px-2 text-sm">
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
      </select>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Commentaire" className="h-9 rounded-md border px-2 text-sm" />
      <Button size="sm" onClick={submit}>Envoyer</Button>
    </div>
  );
}
