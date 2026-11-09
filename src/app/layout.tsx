import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reporta Hermosillo",
    template: "%s · Reporta Hermosillo",
  },
  description:
    "Reporta problemas, da seguimiento a solicitudes y consulta la transparencia del gobierno municipal de Hermosillo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}
      >
        <Header />
        <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
