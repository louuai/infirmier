"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HeartPulse, LogOut, User, ChevronDown, LayoutDashboard, FileText, ShieldCheck, MessageSquare } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";

interface Me {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "PATIENT" | "NURSE" | "ADMIN";
  nurseProfile?: { verificationStatus: string } | null;
}

export function Navbar() {
  const [me, setMe] = useState<Me | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Re-vérifie la session à chaque changement de route (corrige l'état figé après login)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d?.data?.user ?? null))
      .catch(() => setMe(null));
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const dashHref = me?.role === "ADMIN" ? "/admin" : me?.role === "NURSE" ? "/dashboard/nurse" : "/dashboard/patient";
  const isVerifiedNurse = me?.role === "NURSE" && me.nurseProfile?.verificationStatus === "APPROVED";

  const menuItems =
    me?.role === "ADMIN"
      ? [
          { href: "/admin", label: "Centre de contrôle", icon: LayoutDashboard },
          { href: "/admin?tab=services", label: "Services & tarifs", icon: FileText },
          { href: "/admin?tab=verify", label: "Vérifications", icon: ShieldCheck },
          { href: "/admin?tab=messages", label: "Messages", icon: MessageSquare },
        ]
      : me?.role === "NURSE"
        ? [
            { href: "/dashboard/nurse", label: "Tableau de bord", icon: LayoutDashboard },
            { href: "/dashboard/nurse?tab=documents", label: "Mes documents", icon: ShieldCheck },
            { href: "/dashboard/nurse?tab=invoices", label: "Mes factures", icon: FileText },
            { href: "/dashboard/nurse?tab=contact", label: "Contacter l'admin", icon: MessageSquare },
          ]
        : [
            { href: "/dashboard/patient", label: "Mes réservations", icon: LayoutDashboard },
            { href: "/dashboard/patient?tab=invoices", label: "Mes factures", icon: FileText },
          ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-[#03040d]/70 backdrop-blur-xl" : "border-b border-transparent bg-transparent"}`}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <HeartPulse className="text-emerald-400" />
          <span>Infirmier<span className="text-sky-400">Tunis</span></span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link href="/search" className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10">
            Trouver un infirmier
          </Link>

          {me ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-white/15 py-1.5 pl-1.5 pr-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-xs font-bold">
                  {me.firstName[0]}{me.lastName[0]}
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  {me.firstName}
                  {isVerifiedNurse && <VerifiedBadge size={14} />}
                </span>
                <ChevronDown className="size-4" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/95 p-1.5 shadow-2xl backdrop-blur-xl">
                  <div className="px-3 py-2">
                    <p className="flex items-center gap-1 text-sm font-semibold text-white">
                      {me.firstName} {me.lastName} {isVerifiedNurse && <VerifiedBadge size={14} />}
                    </p>
                    <p className="truncate text-xs text-slate-400">{me.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">{me.role}</span>
                  </div>
                  <div className="my-1 h-px bg-white/10" />
                  {menuItems.map((it) => (
                    <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10">
                      <it.icon className="size-4 text-slate-400" /> {it.label}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-white/10" />
                  <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/10">
                    <LogOut className="size-4" /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10">
                Connexion
              </Link>
              <Link href="/register" className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(56,189,248,0.8)] transition-transform hover:scale-105">
                Inscription
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
