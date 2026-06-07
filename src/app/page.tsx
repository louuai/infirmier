import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  ShieldCheck,
  CalendarClock,
  CreditCard,
  Stethoscope,
  Star,
} from "lucide-react";

const STEPS = [
  { icon: MapPin, title: "Localisez", text: "Trouvez les infirmiers disponibles près de chez vous." },
  { icon: CalendarClock, title: "Réservez", text: "Choisissez un créneau et le type de soin." },
  { icon: CreditCard, title: "Payez en ligne", text: "Paiement sécurisé. Confirmation immédiate." },
  { icon: Stethoscope, title: "Soyez soigné", text: "L'infirmier intervient directement à domicile." },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Infirmiers vérifiés", text: "Diplôme et CIN validés par notre équipe." },
  { icon: Star, title: "Avis transparents", text: "Notes et commentaires de vrais patients." },
  { icon: MapPin, title: "Près de chez vous", text: "Recherche par ville et par distance GPS." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-background">
        <div className="container grid gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-medical-green/10 px-3 py-1 text-sm font-medium text-medical-green">
              <ShieldCheck className="size-4" /> Soins à domicile certifiés
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Un infirmier qualifié,{" "}
              <span className="text-primary">à votre porte</span>, partout en Tunisie.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Réservez en quelques clics un infirmier près de chez vous. Pansement,
              injection, prise de sang… à domicile, en toute confiance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/search">
                <Button size="lg">Trouver un infirmier</Button>
              </Link>
              <Link href="/register?role=NURSE">
                <Button size="lg" variant="outline">
                  Devenir infirmier partenaire
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="grid w-full max-w-sm gap-4">
              {FEATURES.map((f) => (
                <Card key={f.title}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon />
                    </div>
                    <div>
                      <p className="font-semibold">{f.title}</p>
                      <p className="text-sm text-muted-foreground">{f.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Comment ça marche ?</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="relative">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <s.icon className="size-6" />
                </div>
                <span className="text-sm font-bold text-primary">Étape {i + 1}</span>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold">Besoin de soins à domicile aujourd'hui ?</h2>
          <p className="max-w-lg text-primary-foreground/80">
            Des infirmiers disponibles près de chez vous, prêts à intervenir.
          </p>
          <Link href="/search">
            <Button size="lg" variant="secondary">
              Réserver maintenant
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
