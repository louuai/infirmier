"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BookingForm({ nurseId }: { nurseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);

    // 1) Vérifier la session
    const me = await fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null));
    if (!me?.data?.user) {
      router.push(`/login?redirect=/nurses/${nurseId}`);
      return;
    }

    // 2) Créer la réservation
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nurseId,
        scheduledAt: f.get("scheduledAt"),
        serviceType: f.get("serviceType"),
        notes: f.get("notes") || undefined,
        address: f.get("address"),
        city: f.get("city") || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      setLoading(false);
      return;
    }

    // 3) Payer (mock : confirmation immédiate)
    const pay = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: data.data.booking.id }),
    });
    const payData = await pay.json();
    setLoading(false);

    if (payData.redirectUrl) {
      window.location.href = payData.redirectUrl;
      return;
    }
    router.push("/dashboard/patient?payment=success");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="serviceType">Type de soin</Label>
        <Input id="serviceType" name="serviceType" required placeholder="Pansement, injection..." />
      </div>
      <div>
        <Label htmlFor="scheduledAt">Date & heure</Label>
        <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
      </div>
      <div>
        <Label htmlFor="address">Adresse de la visite</Label>
        <Input id="address" name="address" required placeholder="Rue, ville..." />
      </div>
      <div>
        <Label htmlFor="city">Ville</Label>
        <Input id="city" name="city" />
      </div>
      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea id="notes" name="notes" placeholder="Précisions pour l'infirmier..." />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Traitement..." : "Réserver & payer"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé. Commission plateforme 10%.
      </p>
    </form>
  );
}
