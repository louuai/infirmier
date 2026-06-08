"use client";

import { useEffect, useState, useCallback } from "react";
import { ChatBox } from "@/components/chat-box";
import { MessageSquare, ShieldQuestion } from "lucide-react";

interface Convo { id: string; kind: string; bookingService: string | null; other: { name: string; role: string } | null; lastMessage: string | null; unread: number; }

export default function MessagesPage() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConvos = useCallback(async () => {
    const r = await fetch("/api/conversations");
    const d = await r.json();
    setConvos(d.data?.conversations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const admin = params.get("admin");
      const booking = params.get("booking");
      const open = params.get("open");
      if (admin) {
        const r = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "admin" }) });
        const d = await r.json(); if (r.ok) setActive(d.data.conversationId);
      } else if (booking) {
        const r = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: booking }) });
        const d = await r.json(); if (r.ok) setActive(d.data.conversationId); else alert(d.error);
      } else if (open) setActive(open);
      loadConvos();
    })();
  }, [loadConvos]);

  async function contactAdmin() {
    const r = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "admin" }) });
    const d = await r.json(); if (r.ok) { setActive(d.data.conversationId); loadConvos(); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container py-8">
        <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold"><MessageSquare className="text-emerald-400" /> Messagerie</h1>
        <div className="grid h-[70vh] gap-4 overflow-hidden rounded-2xl glass lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col border-r border-white/10">
            <button onClick={contactAdmin} className="m-3 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10">
              <ShieldQuestion className="size-4" /> Contacter l'admin
            </button>
            <div className="flex-1 overflow-y-auto">
              {loading ? <p className="p-4 text-sm text-slate-500">Chargement…</p> : convos.length === 0 ? <p className="p-4 text-sm text-slate-500">Aucune conversation.</p> : convos.map((c) => (
                <button key={c.id} onClick={() => setActive(c.id)} className={`flex w-full items-center justify-between gap-2 border-b border-white/5 px-4 py-3 text-left transition ${active === c.id ? "bg-white/10" : "hover:bg-white/5"}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{c.other?.name ?? "Conversation"} {c.kind === "CLIENT_NURSE" && c.bookingService ? `· ${c.bookingService}` : c.other?.role === "ADMIN" ? "· Admin" : ""}</p>
                    <p className="truncate text-xs text-slate-500">{c.lastMessage ?? "—"}</p>
                  </div>
                  {c.unread > 0 && <span className="rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">{c.unread}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0">
            {active ? <ChatBox conversationId={active} /> : <div className="flex h-full items-center justify-center text-slate-500">Sélectionnez une conversation</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
