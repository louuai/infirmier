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
  Sparkles,
} from "lucide-react";

const AstralBackground = dynamic(() => import("@/components/astral-background"), {
  ssr: false,
  loading: () => null,
});

const STEPS = [
  { icon: MapPin, title: "Localisez", text: "Trouvez les infirmiers disponibles près de chez vous." },
  { icon: CalendarClock, title: "Réservez", text: "Choisissez un créneau et le type de soin." },
  { icon: CreditCard, title: "Payez en ligne", text: "Paiement sécurisé, confirmation immédiate." },
  { icon: Stethoscope, title: "Soyez soigné", text: "L'infirmier intervient directement à domicile." },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Infirmiers vérifiés", text: "Diplôme et CIN validés par notre équipe avant toute mission." },
  { icon: Star, title: "Avis transparents", text: "Notes et commentaires laissés par de vrais patients." },
  { icon: MapPin, title: "Près de chez vous", text: "Recherche par ville et par distance GPS en temps réel." },
];

const STATS = [
  { value: "24/7", label: "Disponibilité" },
  { value: "10 min", label: "Réservation moyenne" },
  { value: "100%", label: "Profils vérifiés" },
  { value: "+24", label: "Villes couvertes" },
];

export default function HomePage() {
  return (
    <div className="bg-[#03060f] text-slate-100">
      {/* ===================== HERO ASTRAL ===================== */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <AstralBackground />
        {/* halos lumineux */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#03060f]" />

        <div className="container relative z-10 flex flex-col items-center text-center">
          <span className="animate-floaty mb-8 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium text-emerald-200">
            <Sparkles className="size-4" /> Soins infirmiers à domicile, réinventés
          </span>

          <div className="relative mb-6">
            <div className="relative mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl glass">
              <HeartPulse className="size-10 text-emerald-300" />
              <span className="pulse-ring absolute inset-0" />
            </div>
          </div>

          <h1 className="max-w-4xl text-balance text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Un infirmier qualifié,
            <br />
            <span className="gradient-text text-glow">à votre porte</span>, en un instant.
          </h1>

          <p className="mt-7 max-w-xl text-lg text-slate-300/90">
            Réservez en quelques clics un infirmier près de chez vous. Pansement,
            injection, prise de sang… à domicile, en toute confiance, partout en Tunisie.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-8 py-3.5 font-semibold text-white shadow-[0_0_40px_-8px_rgba(56,189,248,0.7)] transition-transform hover:scale-105"
            >
              <Stethoscope className="size-5" /> Trouver un infirmier
            </Link>
            <Link
              href="/register?role=NURSE"
              className="inline-flex items-center gap-2 rounded-full glass px-8 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Devenir infirmier partenaire
            </Link>
          </div>

          <div className="mt-20 flex animate-blink flex-col items-center text-slate-400">
            <span className="text-xs uppercase tracking-widest">Découvrir</span>
            <ChevronDown className="size-5" />
          </div>
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
        <Reveal className="mb-16 text-center">
          <h2 className="text-4xl font-bold md:text-5xl">
            Comment ça <span className="gradient-text">marche</span> ?
          </h2>
          <p className="mt-4 text-slate-400">Quatre étapes, zéro friction.</p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 110}>
              <div className="group relative h-full rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400/40 hover:shadow-[0_20px_60px_-20px_rgba(16,185,129,0.5)]">
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-emerald-300 transition-transform group-hover:scale-110">
                  <s.icon className="size-6" />
                </div>
                <span className="text-xs font-bold tracking-widest text-sky-400">
                  ÉTAPE {i + 1}
                </span>
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
              <HeartPulse className="size-5 text-emerald-500" /> Réserver maintenant
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
