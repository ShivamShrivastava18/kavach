import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { isDemoMode } from "@/lib/env";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kavach",
  description: "A photo shield. Proves a morphed image was made from your own photo, blurs it, and writes the complaint a platform must act on within 2 hours.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="grain flex min-h-full flex-col">
        <Shell demo={isDemoMode()}>{children}</Shell>
      </body>
    </html>
  );
}
