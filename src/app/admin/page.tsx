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
          <UserManager users={users} reload={() => fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.data?.users ?? []))} />
        )}

        {tab === "messages" && (
          <div className="space-y-3">
            <a href="/messages" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white">Ouvrir la messagerie temps réel</a>
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

const MONEY_KEYS = ["revenuBrut", "revenuNet", "aTransferer", "totalDepense"];
const KEY_LABELS: Record<string, string> = {
  missions: "Missions", revenuBrut: "Revenu brut", revenuNet: "Revenu net", aTransferer: "À transférer",
  note: "Note moyenne", reservations: "Réservations", totalDepense: "Total dépensé",
};

function UserManager({ users, reload }: { users: any[]; reload: () => void }) {
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const inputCls = "h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-white outline-none focus:border-sky-400/60";

  async function open(id: string) {
    setSelected(id); setDetail(null);
    const d = await fetch(`/api/admin/users/${id}`).then((r) => r.json());
    setDetail(d.data);
  }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      email: f.get("email"), password: f.get("password"), firstName: f.get("firstName"), lastName: f.get("lastName"),
      phone: f.get("phone") || undefined, role: f.get("role"),
    }) });
    if (!res.ok) { alert((await res.json()).error); return; }
    setCreating(false); reload();
  }
  async function transfer(nurseId: string) {
    const res = await fetch("/api/admin/payouts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nurseId }) });
    if (res.ok) { alert("Transfert effectué ✅"); if (selected) open(selected); } else alert((await res.json()).error);
  }
  async function patch(id: string, data: any) {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    reload(); open(id);
  }
  async function remove(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error); return; }
    setSelected(null); setDetail(null); reload();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <button onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white"><Plus className="size-4" /> Nouvel utilisateur</button>
        {creating && (
          <form onSubmit={create} className="mt-3 grid gap-2 rounded-2xl glass p-4 sm:grid-cols-2">
            <input name="firstName" placeholder="Prénom" required className={inputCls} />
            <input name="lastName" placeholder="Nom" required className={inputCls} />
            <input name="email" placeholder="Email" required className={inputCls} />
            <input name="phone" placeholder="Téléphone" className={inputCls} />
            <input name="password" type="password" placeholder="Mot de passe (8+)" required className={inputCls} />
            <select name="role" className={inputCls}>
              <option value="PATIENT" className="bg-[#0b1220]">Patient</option>
              <option value="NURSE" className="bg-[#0b1220]">Infirmier</option>
              <option value="ADMIN" className="bg-[#0b1220]">Admin</option>
            </select>
            <button className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white sm:col-span-2">Créer</button>
          </form>
        )}
        <div className="mt-3 space-y-2">
          {users.map((u) => (
            <button key={u.id} onClick={() => open(u.id)} className={`block w-full rounded-2xl glass p-4 text-left transition ${selected === u.id ? "border-emerald-400/50" : "hover:bg-white/5"}`}>
              <div className="flex items-center justify-between">
                <div><p className="font-semibold text-white">{u.firstName} {u.lastName}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{u.role}</span>
                  {!u.isActive && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">désactivé</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:h-fit">
        {!selected ? (
          <p className="text-slate-500">Cliquez sur un utilisateur pour voir sa fiche.</p>
        ) : !detail ? (
          <p className="text-slate-500">Chargement…</p>
        ) : (
          <div className="rounded-2xl glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{detail.user.firstName} {detail.user.lastName}</h3>
                <p className="text-sm text-slate-400">{detail.user.email}</p>
                <p className="mt-1 text-xs text-slate-500">{detail.user.role} · {detail.user.isActive ? "actif" : "désactivé"}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {Object.entries(detail.analytics ?? {}).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-slate-400">{KEY_LABELS[k] ?? k}</p>
                  <p className="mt-0.5 font-bold text-white">{MONEY_KEYS.includes(k) ? formatTND(Number(v)) : String(v)}</p>
                </div>
              ))}
            </div>

            {detail.pendingPayout > 0 && detail.user.nurseProfile && (
              <button onClick={() => transfer(detail.user.nurseProfile.id)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white">
                <Wallet className="size-5" /> Transférer {formatTND(detail.pendingPayout)} à l'infirmier
              </button>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => patch(detail.user.id, { isActive: !detail.user.isActive })} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white hover:bg-white/10">
                {detail.user.isActive ? "Désactiver" : "Activer"}
              </button>
              <select defaultValue={detail.user.role} onChange={(e) => patch(detail.user.id, { role: e.target.value })} className={inputCls}>
                <option value="PATIENT" className="bg-[#0b1220]">Patient</option>
                <option value="NURSE" className="bg-[#0b1220]">Infirmier</option>
                <option value="ADMIN" className="bg-[#0b1220]">Admin</option>
              </select>
              <button onClick={() => remove(detail.user.id)} className="rounded-full bg-rose-500/80 px-4 py-1.5 text-sm font-semibold text-white">Supprimer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
