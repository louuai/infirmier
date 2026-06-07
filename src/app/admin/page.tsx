"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTND } from "@/lib/utils";
import { Users, Stethoscope, CalendarCheck, Wallet, Percent, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingNurses, setPendingNurses] = useState<any[]>([]);
  const [tab, setTab] = useState<"verify" | "users">("verify");
  const [users, setUsers] = useState<any[]>([]);

  const load = useCallback(async () => {
    const [s, n] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/nurses?status=PENDING").then((r) => r.json()),
    ]);
    setStats(s.data?.stats ?? null);
    setPendingNurses(n.data?.nurses ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === "users") {
      fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.data?.users ?? []));
    }
  }, [tab]);

  async function verify(nurseId: string, decision: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/nurses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nurseId, decision }),
    });
    load();
  }

  async function toggleUser(userId: string, isActive: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isActive: !isActive }),
    });
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.data?.users ?? []));
  }

  const cards = stats ? [
    { icon: Users, label: "Patients", value: stats.patients },
    { icon: Stethoscope, label: "Infirmiers", value: stats.nurses },
    { icon: CalendarCheck, label: "Réservations", value: stats.bookings },
    { icon: Wallet, label: "Chiffre d'affaires", value: formatTND(stats.revenue) },
    { icon: Percent, label: "Commission totale", value: formatTND(stats.commissionTotal) },
    { icon: Clock, label: "Réservations aujourd'hui", value: stats.bookingsToday },
    { icon: CalendarCheck, label: "Réservations ce mois", value: stats.bookingsMonth },
    { icon: Stethoscope, label: "Infirmiers à valider", value: stats.pendingNurses },
  ] : [];

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Tableau de bord administrateur</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}><CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><c.icon className="size-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <div className="mb-4 flex gap-2 border-b">
        {([["verify", "Vérification infirmiers"], ["users", "Utilisateurs"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium ${tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      {tab === "verify" && (
        <div className="space-y-3">
          {pendingNurses.length === 0 && <p className="text-muted-foreground">Aucun infirmier en attente.</p>}
          {pendingNurses.map((n) => (
            <Card key={n.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">{n.user.firstName} {n.user.lastName}</p>
                <p className="text-sm text-muted-foreground">{n.user.email} · {n.city ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{n.documents.length} document(s) soumis</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => verify(n.id, "APPROVED")}>Valider</Button>
                <Button size="sm" variant="destructive" onClick={() => verify(n.id, "REJECTED")}>Refuser</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {tab === "users" && (
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th></th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3">{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td><Badge variant="outline">{u.role}</Badge></td>
                  <td>{u.isActive ? <Badge variant="success">Actif</Badge> : <Badge variant="destructive">Désactivé</Badge>}</td>
                  <td className="p-2">
                    {u.role !== "ADMIN" && (
                      <Button size="sm" variant="outline" onClick={() => toggleUser(u.id, u.isActive)}>
                        {u.isActive ? "Désactiver" : "Activer"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}
    </div>
  );
}
