import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HIIT Gym – Train Hard. Live Strong.",
  description:
    "High-intensity training, premium equipment, and a community that pushes you. Join HIIT Gym.",
  icons: {
    icon: "/images/icon.png",
    apple: "/images/icon.png",
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
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} antialiased font-sans text-stone-100 min-h-screen`}
      >
        <InteractiveGridPattern
          cellSize={50}
          glowColor="rgba(239, 68, 68, 0.35)"
          borderColor="rgba(63, 63, 70, 0.35)"
          proximity={120}
          className="bg-stone-950"
        />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
