"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTND, formatDate } from "@/lib/utils";
import { Users, Stethoscope, CalendarCheck, Wallet, Percent, Clock, Plus, Trash2, FileText } from "lucide-react";

type Tab = "overview" | "services" | "verify" | "users" | "messages";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [services, setServices] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (t) setTab(t);
  }, []);

  const loadStats = useCallback(async () => {
    const s = await fetch("/api/admin/stats").then((r) => r.json());
    setStats(s.data?.stats ?? null);
  }, []);
  const loadServices = useCallback(async () => {
    const d = await fetch("/api/services?all=1").then((r) => r.json());
    setServices(d.data?.services ?? []);
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (tab === "services") loadServices();
    if (tab === "verify") fetch("/api/admin/nurses?status=PENDING").then((r) => r.json()).then((d) => setPending(d.data?.nurses ?? []));
    if (tab === "users") fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.data?.users ?? []));
    if (tab === "messages") fetch("/api/notifications").then((r) => r.json()).then((d) => setMessages((d.data?.notifications ?? []).filter((n: any) => n.metadata?.support)));
  }, [tab, loadServices]);

  async function verify(nurseId: string, decision: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/nurses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nurseId, decision }) });
    fetch("/api/admin/nurses?status=PENDING").then((r) => r.json()).then((d) => setPending(d.data?.nurses ?? []));
    loadStats();
  }

  const cards = stats ? [
    { icon: Wallet, label: "Chiffre d'affaires", value: formatTND(stats.revenue) },
    { icon: Percent, label: "Commission (20%)", value: formatTND(stats.commissionTotal) },
    { icon: Wallet, label: "Revenus infirmiers", value: formatTND(stats.nurseRevenue) },
    { icon: CalendarCheck, label: "Réservations", value: stats.bookings },
    { icon: Users, label: "Patients", value: stats.patients },
    { icon: Stethoscope, label: "Infirmiers", value: stats.nurses },
    { icon: Clock, label: "Aujourd'hui", value: stats.bookingsToday },
    { icon: Stethoscope, label: "À valider", value: stats.pendingNurses },
  ] : [];

  const tabs: [Tab, string][] = [
    ["overview", "Vue globale"], ["services", "Services & tarifs"], ["verify", "Vérification"], ["users", "Utilisateurs"], ["messages", "Messages"],
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Centre de contrôle</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl glass p-5">
              <div className="flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-emerald-300"><c.icon className="size-5" /></div>
              <div><p className="text-sm text-slate-400">{c.label}</p><p className="text-xl font-bold">{c.value}</p></div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium ${tab === k ? "border-b-2 border-emerald-400 text-emerald-300" : "text-slate-400"}`}>{l}</button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <div className="rounded-2xl glass p-6">
            <h2 className="mb-3 font-semibold">Services populaires</h2>
            {stats.popularServices?.length ? (
              <div className="space-y-2">
                {stats.popularServices.map((p: any) => (
                  <div key={p.slug} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"><span className="text-slate-200">{p.slug}</span><span className="text-emerald-300">{p.count} missions</span></div>
                ))}
              </div>
            ) : <p className="text-slate-500">Pas encore de données (aucune mission terminée).</p>}
          </div>
        )}

        {tab === "services" && <ServicesManager services={services} reload={loadServices} />}

        {tab === "verify" && (
          <div className="space-y-3">
            {pending.length === 0 && <p className="text-slate-500">Aucun infirmier en attente.</p>}
            {pending.map((n) => (
              <div key={n.id} className="rounded-2xl glass p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{n.user.firstName} {n.user.lastName}</p>
                    <p className="text-sm text-slate-400">{n.user.email} · {n.city ?? "—"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => verify(n.id, "APPROVED")} className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-1.5 text-sm font-semibold text-white">Valider</button>
                    <button onClick={() => verify(n.id, "REJECTED")} className="rounded-full bg-rose-500/80 px-4 py-1.5 text-sm font-semibold text-white">Refuser</button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(n.documents ?? []).length === 0 && <span className="text-xs text-amber-300">Aucun document fourni</span>}
                  {(n.documents ?? []).map((d: any) => (
                    <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-sky-300 hover:bg-white/10">
                      <FileText className="size-3.5" /> {d.type === "DIPLOMA" ? "Diplôme" : "CIN"}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="overflow-hidden rounded-2xl glass">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-slate-400"><th className="p-3">Nom</th><th>Email</th><th>Rôle</th><th>Statut</th></tr></thead>
              <tbody>
                {users.map((u) => (<tr key={u.id} className="border-b border-white/5"><td className="p-3">{u.firstName} {u.lastName}</td><td>{u.email}</td><td>{u.role}</td><td>{u.isActive ? "Actif" : "Désactivé"}</td></tr>))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-3">
            {messages.length === 0 && <p className="text-slate-500">Aucun message.</p>}
            {messages.map((m) => (
              <div key={m.id} className="rounded-2xl glass p-5">
                <div className="flex items-center justify-between"><p className="font-semibold">{m.title}</p><span className="text-xs text-slate-500">{formatDate(m.createdAt)}</span></div>
                <p className="mt-1 text-sm text-slate-300">{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServicesManager({ services, reload }: { services: any[]; reload: () => void }) {
  const [creating, setCreating] = useState(false);
  const inputCls = "h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-white outline-none focus:border-sky-400/60";
  async function update(id: string, data: any) { await fetch(`/api/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); reload(); }
  async function remove(id: string) { if (!confirm("Supprimer ce service ?")) return; await fetch(`/api/services/${id}`, { method: "DELETE" }); reload(); }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const res = await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: String(f.get("slug")), name: String(f.get("name")), price: Number(f.get("price")), description: f.get("description") || undefined }) });
    if (!res.ok) { alert((await res.json()).error); return; }
    setCreating(false); reload();
  }
  return (
    <div className="space-y-3">
      <button onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white"><Plus className="size-4" /> Nouveau service</button>
      {creating && (
        <form onSubmit={create} className="grid gap-2 rounded-2xl glass p-4 sm:grid-cols-4">
          <input name="name" placeholder="Nom" required className={inputCls} />
          <input name="slug" placeholder="slug-du-service" required className={inputCls} />
          <input name="price" type="number" step="0.5" placeholder="Prix TND" required className={inputCls} />
          <input name="description" placeholder="Description" className={inputCls} />
          <button className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white sm:col-span-4">Créer</button>
        </form>
      )}
      {services.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass p-4">
          <div className="min-w-0"><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.slug}</p></div>
          <div className="flex items-center gap-2">
            <input defaultValue={s.price} type="number" step="0.5" onBlur={(e) => update(s.id, { price: Number(e.target.value) })} className={`w-24 ${inputCls}`} />
            <span className="text-xs text-slate-400">TND</span>
            <button onClick={() => update(s.id, { active: !s.active })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${s.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}>{s.active ? "Actif" : "Inactif"}</button>
            <button onClick={() => remove(s.id)} className="rounded-full p-2 text-rose-300 hover:bg-white/10"><Trash2 className="size-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
