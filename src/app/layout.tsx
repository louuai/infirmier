import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/navbar";
import { PWARegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Infirmier Tunis — Soins infirmiers à domicile",
  description:
    "Réservez un infirmier qualifié à domicile partout en Tunisie. Rapide, sûr, près de chez vous.",
  manifest: "/manifest.webmanifest",
  applicationName: "Infirmier Tunis",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Infirmier Tunis" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#03040d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <PWARegister />
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
        <footer className="border-t border-white/10 bg-[#03060f] py-10 text-center text-sm text-slate-400">
          <span className="font-semibold text-slate-200">Infirmier<span className="text-sky-400">Tunis</span></span>
          <span className="mx-2">·</span>
          © {new Date().getFullYear()} — Soins infirmiers à domicile, partout en Tunisie.
        </footer>
      </body>
    </html>
  );
}
