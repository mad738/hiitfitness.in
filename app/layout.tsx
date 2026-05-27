import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const ethnocentric = localFont({
  src: "../public/fonts/ethnocentric rg.otf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HIIT Fitness – High Intensity Interval Training.",
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
        className={`${inter.variable} ${ethnocentric.variable} antialiased font-sans text-stone-100 min-h-screen`}
      >
        <InteractiveGridPattern
          cellSize={24} // Decreased cell size for a denser, more high-tech grid
          glowColor="rgba(238, 42, 36, 0.8)" // High-intensity brand red
          borderColor="rgba(255, 255, 255, 0.1)" // Crisp white grid lines
          proximity={180} // Larger glow radius
          className="bg-[#050505]" // Deep futuristic black
        />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
