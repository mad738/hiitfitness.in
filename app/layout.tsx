import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";

const aksans = localFont({
  src: "../public/fonts/aksans-750.otf",
  variable: "--font-sans",
  display: "swap",
});

const ethnocentric = localFont({
  src: "../public/fonts/ethnocentric rg.otf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HIIT Fitness – Train Hard. Live Strong.",
  description:
    "High-intensity interval training, premium equipment, and a community that pushes you. Join HIIT Fitness.",
  icons: {
    icon: "/images/facicon.jpg",
    apple: "/images/facicon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${aksans.variable} ${ethnocentric.variable} antialiased font-sans text-stone-100 min-h-screen`}
      >
        <InteractiveGridPattern
          cellSize={50}
          glowColor="rgba(255, 0, 0, 0.35)"
          borderColor="rgba(255, 255, 255, 0.12)"
          proximity={120}
          className="bg-black"
        />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
