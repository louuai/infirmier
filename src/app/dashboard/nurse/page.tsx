"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatTND } from "@/lib/utils";

interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  serviceType: string;
  address: string;
  price: number;
  nurseAmount: number;
  commissionAmount: number;
  patient: { firstName: string; lastName: string; phone: string | null };
}

export default function NurseDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab] = useState<"requests" | "earnings" | "profile">("requests");

  const load = useCallback(async () => {
    const [b, p] = await Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/nurses/me").then((r) => r.json()),
    ]);
    setBookings(b.data?.bookings ?? []);
    setProfile(p.data?.nurse ?? null);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: string) {
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) alert((await res.json()).error);
    load();
  }

  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const totalRevenue = completed.reduce((s, b) => s + b.nurseAmount, 0);
  const totalCommission = completed.reduce((s, b) => s + b.commissionAmount, 0);
  const pending = bookings.filter((b) => b.status === "PENDING_NURSE");

  const verified = profile?.verificationStatus === "APPROVED";

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Espace infirmier</h1>
      {!verified && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Votre compte est <strong>{profile?.verificationStatus === "REJECTED" ? "refusé" : "en attente de validation"}</strong>.
          Complétez votre profil et vos documents (diplôme, CIN). Vous recevrez des réservations une fois validé par l'admin.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenus (net 90%)" value={formatTND(totalRevenue)} />
        <StatCard label="Commission versée (10%)" value={formatTND(totalCommission)} />
        <StatCard label="Demandes en attente" value={String(pending.length)} />
      </div>

      <div className="mb-4 flex gap-2 border-b">
        {([["requests", "Réservations"], ["earnings", "Revenus & commissions"], ["profile", "Profil & disponibilités"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium ${tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="space-y-3">
          {bookings.length === 0 && <p className="text-muted-foreground">Aucune réservation.</p>}
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold">{b.serviceType} · <span className="text-primary">{formatTND(b.nurseAmount)}</span> net</p>
                  <p className="text-sm text-muted-foreground">
                    {b.patient.firstName} {b.patient.lastName} {b.patient.phone && `· ${b.patient.phone}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatDate(b.scheduledAt)} · {b.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{b.status}</Badge>
                  {b.status === "PENDING_NURSE" && (
                    <>
                      <Button size="sm" onClick={() => act(b.id, "accept")}>Accepter</Button>
                      <Button size="sm" variant="outline" onClick={() => act(b.id, "refuse")}>Refuser</Button>
                    </>
                  )}
                  {b.status === "ACCEPTED" && <Button size="sm" onClick={() => act(b.id, "start")}>Démarrer</Button>}
                  {b.status === "IN_PROGRESS" && <Button size="sm" onClick={() => act(b.id, "complete")}>Terminer</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "earnings" && (
        <Card>
          <CardHeader><CardTitle>Historique des visites terminées</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="py-2">Date</th><th>Soin</th><th>Prix</th><th>Commission</th><th>Net</th>
              </tr></thead>
              <tbody>
                {completed.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2">{formatDate(b.scheduledAt)}</td>
                    <td>{b.serviceType}</td>
                    <td>{formatTND(b.price)}</td>
                    <td className="text-destructive">-{formatTND(b.commissionAmount)}</td>
                    <td className="font-medium text-medical-green">{formatTND(b.nurseAmount)}</td>
                  </tr>
                ))}
                {completed.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Aucune visite terminée.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "profile" && profile && <NurseProfileForm profile={profile} onSaved={load} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </CardContent></Card>
  );
}

function NurseProfileForm({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const f = new FormData(e.currentTarget);
    await fetch("/api/nurses/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          bio: f.get("bio"),
          specialties: String(f.get("specialties") || "").split(",").map((s) => s.trim()).filter(Boolean),
          yearsOfExperience: Number(f.get("yearsOfExperience") || 0),
          pricePerVisit: Number(f.get("pricePerVisit") || 0),
          city: f.get("city"),
          address: f.get("address"),
          latitude: f.get("latitude") ? Number(f.get("latitude")) : undefined,
          longitude: f.get("longitude") ? Number(f.get("longitude")) : undefined,
          interventionRadiusKm: Number(f.get("interventionRadiusKm") || 10),
          isAvailable: f.get("isAvailable") === "on",
        },
      }),
    });
    setSaving(false);
    onSaved();
    alert("Profil mis à jour");
  }

  function geolocate(form: HTMLFormElement) {
    navigator.geolocation.getCurrentPosition((pos) => {
      (form.elements.namedItem("latitude") as HTMLInputElement).value = String(pos.coords.latitude);
      (form.elements.namedItem("longitude") as HTMLInputElement).value = String(pos.coords.longitude);
    });
  }

  return (
    <Card><CardContent className="p-6">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Bio</Label>
          <Textarea name="bio" defaultValue={profile.bio ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <Label>Spécialités (séparées par des virgules)</Label>
          <Input name="specialties" defaultValue={(profile.specialties ?? []).join(", ")} />
        </div>
        <div><Label>Années d'expérience</Label><Input name="yearsOfExperience" type="number" defaultValue={profile.yearsOfExperience} /></div>
        <div><Label>Prix par visite (TND)</Label><Input name="pricePerVisit" type="number" step="0.5" defaultValue={profile.pricePerVisit} /></div>
        <div><Label>Ville</Label><Input name="city" defaultValue={profile.city ?? ""} /></div>
        <div><Label>Adresse</Label><Input name="address" defaultValue={profile.address ?? ""} /></div>
        <div><Label>Latitude</Label><Input name="latitude" defaultValue={profile.latitude ?? ""} /></div>
        <div><Label>Longitude</Label><Input name="longitude" defaultValue={profile.longitude ?? ""} /></div>
        <div><Label>Rayon d'intervention (km)</Label><Input name="interventionRadiusKm" type="number" defaultValue={profile.interventionRadiusKm} /></div>
        <div className="flex items-center gap-2 pt-6">
          <input id="isAvailable" name="isAvailable" type="checkbox" defaultChecked={profile.isAvailable} className="size-4" />
          <Label htmlFor="isAvailable" className="mb-0">Disponible</Label>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving}>{saving ? "Sauvegarde..." : "Enregistrer"}</Button>
          <Button type="button" variant="outline" onClick={(e) => geolocate(e.currentTarget.form!)}>Me géolocaliser</Button>
        </div>
      </form>
    </CardContent></Card>
  );
}
