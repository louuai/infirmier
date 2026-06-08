"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { formatDate, formatTND } from "@/lib/utils";
import { Loader2, Navigation, Power, ShieldCheck, FileText, Trash2, Send } from "lucide-react";

interface Booking {
  id: string; status: string; address: string; price: number; nurseAmount: number; commissionAmount: number;
  completedAt: string | null; createdAt: string;
  service: { name: string };
  patient: { firstName: string; lastName: string; phone: string | null } | null;
  guestName?: string | null; guestPhone?: string | null;
  invoice?: { number: string } | null;
}
interface Service { id: string; name: string; }
type Tab = "home" | "requests" | "documents" | "invoices" | "contact" | "profile";

const AVAIL = [
  { key: "AVAILABLE", label: "Disponible", c: "bg-emerald-500 text-white" },
  { key: "BUSY", label: "Occupé", c: "bg-amber-500 text-white" },
  { key: "OFFLINE", label: "Hors ligne", c: "bg-slate-600 text-white" },
];

export default function NurseDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(true);
  const sharing = useRef<number | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (t) setTab(t);
  }, []);

  const load = useCallback(async () => {
    const [b, p, s] = await Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/nurses/me").then((r) => r.json()),
      fetch("/api/services?all=1").then((r) => r.json()),
    ]);
    setBookings(b.data?.bookings ?? []);
    setProfile(p.data?.nurse ?? null);
    setAllServices(s.data?.services ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setAvailability(availability: string) {
    await fetch("/api/nurses/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { availability } }) });
    load();
  }
  async function act(id: string, action: string) {
    const res = await fetch(`/api/bookings/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (!res.ok) alert((await res.json()).error);
    load();
  }
  function toggleShare(id: string) {
    if (sharingId === id) {
      if (sharing.current) navigator.geolocation.clearWatch(sharing.current);
      sharing.current = null; setSharingId(null); return;
    }
    sharing.current = navigator.geolocation.watchPosition(async (pos) => {
      await fetch(`/api/tracking/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }) });
    }, () => {}, { enableHighAccuracy: true });
    setSharingId(id);
  }

  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const now = Date.now();
  const day = 86400000;
  const sum = (since: number) => completed.filter((b) => b.completedAt && now - new Date(b.completedAt).getTime() <= since).reduce((a, b) => a + b.nurseAmount, 0);
  const requests = bookings.filter((b) => !["COMPLETED", "REFUSED", "CANCELLED", "EXPIRED"].includes(b.status));
  const billables = bookings.filter((b) => ["AWAITING_PAYMENT", "PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(b.status));

  const verified = profile?.verificationStatus === "APPROVED";
  const myServiceIds: string[] = profile?.services?.map((s: any) => s.service?.id ?? s.serviceId) ?? [];
  const docs: any[] = profile?.documents ?? [];
  const hasDiploma = docs.some((d) => d.type === "DIPLOMA");
  const hasCin = docs.some((d) => d.type === "CIN");

  const tabs: [Tab, string][] = [
    ["home", "Accueil"], ["requests", `Demandes (${requests.length})`],
    ["documents", "Documents"], ["invoices", "Factures"], ["contact", "Contact admin"], ["profile", "Profil"],
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            Espace infirmier {verified && <ShieldCheck className="size-6 text-sky-400" />}
          </h1>
          <div className="flex gap-1.5 rounded-full glass p-1">
            {AVAIL.map((a) => (
              <button key={a.key} onClick={() => setAvailability(a.key)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${profile?.availability === a.key ? a.c : "text-slate-300 hover:bg-white/10"}`}>
                <Power className="size-3.5" /> {a.label}
              </button>
            ))}
          </div>
        </div>

        {!verified && (
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Compte <strong>{profile?.verificationStatus === "REJECTED" ? "refusé" : "en attente de validation"}</strong>.
            {(!hasDiploma || !hasCin) && <> Déposez votre <strong>diplôme</strong> et votre <strong>CIN</strong> dans l'onglet Documents pour être validé.</>}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Revenus aujourd'hui" value={formatTND(sum(day))} />
          <Stat label="Revenus 7 jours" value={formatTND(sum(7 * day))} />
          <Stat label="Revenus 30 jours" value={formatTND(sum(30 * day))} />
        </div>

        <div className="mb-4 mt-6 flex flex-wrap gap-2 border-b border-white/10">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium ${tab === k ? "border-b-2 border-emerald-400 text-emerald-300" : "text-slate-400"}`}>{l}</button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="animate-spin" /></div> : (
          <>
            {tab === "home" && (
              <div className="rounded-2xl glass p-6">
                <h2 className="mb-3 font-semibold">Missions terminées</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/10 text-left text-slate-400"><th className="py-2">Date</th><th>Service</th><th>Brut</th><th>Commission</th><th>Net</th></tr></thead>
                  <tbody>
                    {completed.map((b) => (<tr key={b.id} className="border-b border-white/5"><td className="py-2">{b.completedAt ? formatDate(b.completedAt) : "—"}</td><td>{b.service.name}</td><td>{formatTND(b.price)}</td><td className="text-rose-300">-{formatTND(b.commissionAmount)}</td><td className="font-medium text-emerald-300">{formatTND(b.nurseAmount)}</td></tr>))}
                    {completed.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">Aucune mission terminée.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "requests" && (
              <div className="space-y-3">
                {requests.length === 0 && <p className="text-slate-500">Aucune demande en cours.</p>}
                {requests.map((b) => {
                  const client = b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : b.guestName ?? "Client";
                  const phone = b.patient?.phone ?? b.guestPhone;
                  return (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass p-5">
                      <div>
                        <p className="font-semibold">{b.service.name} · <span className="text-emerald-300">{formatTND(b.nurseAmount)}</span> net</p>
                        <p className="text-sm text-slate-400">{client} {phone && `· ${phone}`}</p>
                        <p className="text-sm text-slate-500">{b.address}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{b.status}</span>
                        {b.status === "REQUESTED" && <><Btn onClick={() => act(b.id, "accept")}>Accepter</Btn><BtnGhost onClick={() => act(b.id, "refuse")}>Refuser</BtnGhost></>}
                        {b.status === "AWAITING_PAYMENT" && <span className="text-xs text-amber-300">En attente du paiement client</span>}
                        {b.status === "PAID" && <Btn onClick={() => act(b.id, "en_route")}>Démarrer (en route)</Btn>}
                        {b.status === "EN_ROUTE" && <>
                          <button onClick={() => toggleShare(b.id)} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${sharingId === b.id ? "bg-emerald-500 text-white" : "border border-emerald-400/40 text-emerald-300"}`}><Navigation className="size-4" /> {sharingId === b.id ? "Position partagée…" : "Partager position"}</button>
                          <Btn onClick={() => act(b.id, "arrived")}>Arrivé</Btn>
                        </>}
                        {b.status === "ARRIVED" && <Btn onClick={() => act(b.id, "start")}>Commencer le soin</Btn>}
                        {b.status === "IN_PROGRESS" && <Btn onClick={() => act(b.id, "complete")}>Terminer</Btn>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "documents" && <Documents docs={docs} hasDiploma={hasDiploma} hasCin={hasCin} onChange={load} />}

            {tab === "invoices" && (
              <div className="space-y-3">
                {billables.length === 0 && <p className="text-slate-500">Aucune facture pour le moment.</p>}
                {billables.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass p-4">
                    <div><p className="font-semibold">{b.service.name} · {formatTND(b.price)}</p><p className="text-xs text-slate-500">{b.invoice ? `Facture ${b.invoice.number}` : "Devis"} · {formatDate(b.createdAt)}</p></div>
                    <Link href={`/invoices/${b.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white hover:bg-white/10"><FileText className="size-4" /> {b.invoice ? "Facture" : "Devis"}</Link>
                  </div>
                ))}
              </div>
            )}

            {tab === "contact" && <ContactAdmin />}

            {tab === "profile" && profile && <ProfileForm profile={profile} allServices={allServices} myServiceIds={myServiceIds} onSaved={load} />}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl glass p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}
function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-1.5 text-sm font-semibold text-white">{children}</button>;
}
function BtnGhost({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white hover:bg-white/10">{children}</button>;
}

function Documents({ docs, hasDiploma, hasCin, onChange }: { docs: any[]; hasDiploma: boolean; hasCin: boolean; onChange: () => void }) {
  const [type, setType] = useState<"DIPLOMA" | "CIN">("DIPLOMA");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const inputCls = "h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-sky-400/60";

  async function add() {
    if (!url) return;
    setSaving(true);
    const res = await fetch("/api/nurses/me/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, fileUrl: url }) });
    setSaving(false);
    if (!res.ok) { alert((await res.json()).error); return; }
    setUrl(""); onChange();
  }
  async function del(id: string) {
    await fetch(`/api/nurses/me/documents?id=${id}`, { method: "DELETE" }); onChange();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass p-6">
        <h2 className="mb-1 font-semibold">Pièces justificatives</h2>
        <p className="mb-4 text-sm text-slate-400">Diplôme d'État + CIN. Visibles uniquement par l'administrateur pour validation. Collez un lien vers vos documents scannés (Drive, photo hébergée…).</p>
        <div className="flex items-center gap-3 text-sm">
          <span className={`rounded-full px-3 py-1 ${hasDiploma ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>Diplôme {hasDiploma ? "✓" : "manquant"}</span>
          <span className={`rounded-full px-3 py-1 ${hasCin ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>CIN {hasCin ? "✓" : "manquante"}</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
          <select value={type} onChange={(e) => setType(e.target.value as "DIPLOMA" | "CIN")} className={inputCls}>
            <option value="DIPLOMA" className="bg-[#0b1220]">Diplôme</option>
            <option value="CIN" className="bg-[#0b1220]">CIN</option>
          </select>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://lien-vers-le-document" className={inputCls} />
          <button onClick={add} disabled={saving} className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">Ajouter</button>
        </div>
      </div>

      <div className="space-y-2">
        {docs.length === 0 && <p className="text-slate-500">Aucun document déposé.</p>}
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-xl glass p-4">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-sky-300" />
              <div><p className="font-medium">{d.type === "DIPLOMA" ? "Diplôme" : "CIN"}</p><a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-400 underline">voir le document</a></div>
            </div>
            <div className="flex items-center gap-2">
              {d.verified && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">vérifié</span>}
              <button onClick={() => del(d.id)} className="rounded-full p-2 text-rose-300 hover:bg-white/10"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactAdmin() {
  const [sent, setSent] = useState(false);
  const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60";
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: f.get("subject"), message: f.get("message") }) });
    if (res.ok) setSent(true); else alert((await res.json()).error);
  }
  if (sent) return <div className="rounded-2xl bg-emerald-500/10 p-6 text-emerald-200">Message envoyé à l'administrateur ✅. Vous serez recontacté.</div>;
  return (
    <form onSubmit={send} className="max-w-xl space-y-3 rounded-2xl glass p-6">
      <h2 className="font-semibold">Contacter l'administrateur</h2>
      <input name="subject" required placeholder="Sujet" className={inputCls} />
      <textarea name="message" required placeholder="Votre message (problème, paiement, vérification...)" className={`min-h-[120px] ${inputCls}`} />
      <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"><Send className="size-4" /> Envoyer</button>
    </form>
  );
}

function ProfileForm({ profile, allServices, myServiceIds, onSaved }: { profile: any; allServices: { id: string; name: string }[]; myServiceIds: string[]; onSaved: () => void }) {
  const [selected, setSelected] = useState<string[]>(myServiceIds);
  const [saving, setSaving] = useState(false);
  const inputCls = "h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-sky-400/60";
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const f = new FormData(e.currentTarget);
    await fetch("/api/nurses/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: {
      bio: f.get("bio"), yearsOfExperience: Number(f.get("yearsOfExperience") || 0),
      city: f.get("city"), address: f.get("address"),
      latitude: f.get("latitude") ? Number(f.get("latitude")) : undefined,
      longitude: f.get("longitude") ? Number(f.get("longitude")) : undefined,
      interventionRadiusKm: Number(f.get("interventionRadiusKm") || 15), serviceIds: selected,
    } }) });
    setSaving(false); onSaved(); alert("Profil mis à jour");
  }
  function geolocate(form: HTMLFormElement) {
    navigator.geolocation.getCurrentPosition((pos) => {
      (form.elements.namedItem("latitude") as HTMLInputElement).value = String(pos.coords.latitude);
      (form.elements.namedItem("longitude") as HTMLInputElement).value = String(pos.coords.longitude);
    });
  }
  return (
    <form onSubmit={save} className="rounded-2xl glass p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="mb-1 block text-xs text-slate-400">Bio</label><textarea name="bio" defaultValue={profile.bio ?? ""} className="min-h-[70px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Années d'expérience</label><input name="yearsOfExperience" type="number" defaultValue={profile.yearsOfExperience} className={inputCls} /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Rayon (km)</label><input name="interventionRadiusKm" type="number" defaultValue={profile.interventionRadiusKm} className={inputCls} /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Ville</label><input name="city" defaultValue={profile.city ?? ""} className={inputCls} /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Adresse</label><input name="address" defaultValue={profile.address ?? ""} className={inputCls} /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Latitude</label><input name="latitude" defaultValue={profile.latitude ?? ""} className={inputCls} /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Longitude</label><input name="longitude" defaultValue={profile.longitude ?? ""} className={inputCls} /></div>
      </div>
      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-slate-300">Services que je propose</p>
        <div className="flex flex-wrap gap-2">
          {allServices.map((s) => {
            const on = selected.includes(s.id);
            return <button type="button" key={s.id} onClick={() => setSelected((p) => on ? p.filter((x) => x !== s.id) : [...p, s.id])} className={`rounded-full px-3 py-1.5 text-sm transition ${on ? "bg-emerald-500 text-white" : "border border-white/15 text-slate-300 hover:bg-white/10"}`}>{s.name}</button>;
          })}
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Sauvegarde..." : "Enregistrer"}</button>
        <button type="button" onClick={(e) => geolocate(e.currentTarget.form!)} className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/10">Me géolocaliser</button>
      </div>
    </form>
  );
}
