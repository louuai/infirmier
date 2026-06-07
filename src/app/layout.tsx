import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Infirmier Tunis — Soins infirmiers à domicile",
  description:
    "Réservez un infirmier qualifié à domicile partout en Tunisie. Rapide, sûr, près de chez vous.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t bg-muted/30 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Infirmier Tunis — Soins à domicile.
        </footer>
      </body>
    </html>
  );
}
