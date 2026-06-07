"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HeartPulse, LogOut } from "lucide-react";

interface Me {
  id: string;
  firstName: string;
  role: "PATIENT" | "NURSE" | "ADMIN";
}

export function Navbar() {
  const [me, setMe] = useState<Me | null>(null);
  const router = useRouter();

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

  const dashboardHref =
    me?.role === "ADMIN"
      ? "/admin"
      : me?.role === "NURSE"
        ? "/dashboard/nurse"
        : "/dashboard/patient";

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <HeartPulse className="text-primary" />
          <span>
            Infirmier<span className="text-primary">Tunis</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/search">
            <Button variant="ghost">Trouver un infirmier</Button>
          </Link>
          {me ? (
            <>
              <Link href={dashboardHref}>
                <Button variant="outline">Mon espace</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} title="Déconnexion">
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/register">
                <Button>Inscription</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
