"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Reveal } from "@/components/reveal";
import {
  MapPin,
  ShieldCheck,
  CalendarClock,
  CreditCard,
  Stethoscope,
  Star,
  HeartPulse,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

const AstralHeart = dynamic(() => import("@/components/astral-heart"), {
  ssr: false,
  loading: () => null,
});

const STEPS = [
  { icon: MapPin, title: "Localisez", text: "Les infirmiers disponibles près de chez vous, en temps réel." },
  { icon: CalendarClock, title: "Réservez", text: "Choisissez un créneau et le type de soin requis." },
  { icon: CreditCard, title: "Payez", text: "Paiement en ligne sécurisé, confirmation immédiate." },
  { icon: Stethoscope, title: "Soyez soigné", text: "L'infirmier intervient directement à votre domicile." },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Infirmiers vérifiés", text: "Diplôme et CIN validés par notre équipe avant chaque mission." },
  { icon: Star, title: "Avis transparents", text: "Notes et commentaires laissés par de vrais patients." },
  { icon: MapPin, title: "Près de chez vous", text: "Recherche par ville et par distance GPS, instantanée." },
];

const STATS = [
  { value: "24/7", label: "Disponibilité" },
  { value: "10 min", label: "Réservation moyenne" },
  { value: "100%", label: "Profils vérifiés" },
  { value: "+24", label: "Villes couvertes" },
];

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400/80 ${className}`}>
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[#03040d] text-slate-100">
      {/* ===================== HERO — CŒUR 3D ===================== */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <AstralHeart />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#03040d_85%)]" />

        {/* micro-labels coins */}
        <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-between px-6 md:px-10">
          <Label>{"// INFIRMIER_TUNIS"}</Label>
          <Label>SOINS · À · DOMICILE</Label>
        </div>

        {/* contenu */}
        <div className="container relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <Reveal>
            <span className="mb-7 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium text-emerald-200">
              <HeartPulse className="size-4 text-rose-400" /> La santé, au rythme de votre cœur
            </span>
          </Reveal>

          <h1 className="max-w-4xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight md:text-8xl">
            <span className="gradient-text text-glow">Prenons soin</span>
            <br />
            de vous, chez vous.
          </h1>

          <p className="mt-7 max-w-xl text-lg text-slate-300/90">
            Un infirmier qualifié à votre porte en quelques clics. Pansement,
            injection, prise de sang… partout en Tunisie, en toute confiance.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-8 py-3.5 font-semibold text-white shadow-[0_0_45px_-8px_rgba(56,189,248,0.8)] transition-transform hover:scale-105"
            >
              <Stethoscope className="size-5" /> Trouver un infirmier
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/register?role=NURSE"
              className="inline-flex items-center gap-2 rounded-full glass px-8 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Devenir partenaire
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex items-end justify-between px-6 md:px-10">
          <Label>TUNISIE — 24/7</Label>
          <div className="flex animate-blink flex-col items-center text-slate-400">
            <ChevronDown className="size-5" />
          </div>
          <Label>WEBGL · ASTRAL</Label>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="relative border-y border-white/5 py-14">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="text-center">
              <p className="gradient-text text-4xl font-extrabold md:text-5xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== COMMENT ÇA MARCHE ===================== */}
      <section className="container py-28">
        <Reveal className="mb-4 text-center"><Label>/ PARCOURS PATIENT</Label></Reveal>
        <Reveal className="mb-16 text-center">
          <h2 className="text-4xl font-bold md:text-5xl">
            Comment ça <span className="gradient-text">marche</span> ?
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 110}>
              <div className="group relative h-full rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400/40 hover:shadow-[0_20px_60px_-20px_rgba(16,185,129,0.5)]">
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-emerald-300 transition-transform group-hover:scale-110">
                  <s.icon className="size-6" />
                </div>
                <span className="font-mono text-xs font-bold tracking-widest text-sky-400">0{i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== POURQUOI NOUS ===================== */}
      <section className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-600/10 blur-[120px]" />
        <div className="container relative">
          <Reveal className="mb-4 text-center"><Label>/ NOTRE PROMESSE</Label></Reveal>
          <Reveal className="mb-16 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Pensé pour votre <span className="gradient-text">tranquillité</span>
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div className="group h-full rounded-2xl glass p-8 transition-all duration-300 hover:-translate-y-2">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 text-sky-300 transition-transform group-hover:rotate-6 group-hover:scale-110">
                    <f.icon className="size-7" />
                  </div>
                  <h3 className="text-xl font-semibold">{f.title}</h3>
                  <p className="mt-3 text-slate-400">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="container pb-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-600/30 via-[#06101f] to-emerald-600/30 p-12 text-center md:p-20">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <h2 className="text-3xl font-bold md:text-5xl">
              Besoin de soins <span className="gradient-text">aujourd'hui</span> ?
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-slate-300">
              Des infirmiers vérifiés, disponibles près de chez vous, prêts à intervenir.
            </p>
            <Link
              href="/search"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 font-semibold text-slate-900 shadow-2xl transition-transform hover:scale-105"
            >
              <HeartPulse className="size-5 text-rose-500" /> Réserver maintenant
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
