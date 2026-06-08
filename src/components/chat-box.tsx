"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send } from "lucide-react";

interface Msg { id: string; body: string; createdAt: string; sender: { id: string; firstName: string; lastName: string }; }

export function ChatBox({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [meId, setMeId] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMsgs = useCallback(async () => {
    const r = await fetch(`/api/conversations/${conversationId}/messages`);
    if (r.ok) { const d = await r.json(); setMessages(d.data.messages); setMeId(d.data.meId); }
  }, [conversationId]);

  useEffect(() => {
    fetchMsgs();
    const i = setInterval(fetchMsgs, 4000);
    let cleanup: (() => void) | undefined;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (key && cluster) {
      import("pusher-js").then(({ default: Pusher }) => {
        const p = new Pusher(key, { cluster });
        const ch = p.subscribe(`conversation-${conversationId}`);
        ch.bind("message", () => fetchMsgs());
        cleanup = () => { p.unsubscribe(`conversation-${conversationId}`); p.disconnect(); };
      });
    }
    return () => { clearInterval(i); cleanup?.(); };
  }, [conversationId, fetchMsgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const body = text;
    setText("");
    await fetch(`/api/conversations/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    setSending(false);
    fetchMsgs();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Démarrez la conversation…</p>}
        {messages.map((m) => {
          const mine = m.sender.id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white" : "bg-white/10 text-slate-100"}`}>
                {!mine && <p className="mb-0.5 text-[11px] font-semibold text-sky-300">{m.sender.firstName}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" className="h-10 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-sky-400/60" />
        <button disabled={sending} className="flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white disabled:opacity-50"><Send className="size-4" /></button>
      </form>
    </div>
  );
}
