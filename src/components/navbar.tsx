"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, LogOut } from "lucide-react";

interface Me {
  id: string;
  firstName: string;
  role: "PATIENT" | "NURSE" | "ADMIN";
}

export function Navbar() {
  const [me, setMe] = useState<Me | null>(null);
  const router = useRouter();
  const clickRef = useRef<{ n: number; t: number }>({ n: 0, t: 0 });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d?.data?.user ?? null))
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  }

  /** Entrée secrète : 5 clics rapides sur le logo → page de connexion. */
  function onLogo() {
    const now = Date.now();
    const prev = clickRef.current;
    const n = now - prev.t < 1000 ? prev.n + 1 : 1;
    clickRef.current = { n, t: now };
    if (n >= 5) {
      clickRef.current = { n: 0, t: 0 };
      router.push("/login");
      return;
    }
    router.push("/");
  }

  const dashboardHref =
    me?.role === "ADMIN"
      ? "/admin"
      : me?.role === "NURSE"
        ? "/dashboard/nurse"
        : "/dashboard/patient";

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#03060f]/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <button
          onClick={onLogo}
          title="Infirmier Tunis"
          className="flex items-center gap-2 text-lg font-bold text-white transition-transform active:scale-95"
        >
          <HeartPulse className="text-emerald-400" />
          <span>
            Infirmier<span className="text-sky-400">Tunis</span>
          </span>
        </button>

        <nav className="flex items-center gap-1.5">
          <Link
            href="/search"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            Trouver un infirmier
          </Link>
          {me ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Mon espace
              </Link>
              <button
                onClick={logout}
                title="Déconnexion"
                className="flex size-9 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(56,189,248,0.8)] transition-transform hover:scale-105"
            >
              Inscription
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
