import Link from "next/link";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function LandingFooter() {
  return (
    <footer className="border-t border-stone-800 py-10 sm:py-12 px-4 sm:px-6">
      <AnimateOnScroll className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-stone-500 text-sm">
          © {new Date().getFullYear()} HIIT Fitness. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a
            href="#facilities"
            className="text-stone-500 hover:text-stone-300 text-sm"
          >
            Facilities
          </a>
          <a href="#plans" className="text-stone-500 hover:text-stone-300 text-sm">
            Plans
          </a>
          <a
            href="#contact"
            className="text-stone-500 hover:text-stone-300 text-sm"
          >
            Contact
          </a>
          <Link href="/admin/login" className="text-stone-500 hover:text-stone-300 text-sm">
            Admin
          </Link>
        </div>
      </AnimateOnScroll>
    </footer>
  );
}
