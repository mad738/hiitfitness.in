"use client";

import { useEffect, useRef, useState } from "react";

type MobileInViewHoverProps = {
  children: React.ReactNode;
  className?: string;
  /** Root margin for Intersection Observer. Default "0px 0px -80px 0px" (trigger when 80px from bottom). */
  rootMargin?: string;
  /** Threshold 0–1. Default 0.25 (card ~25% visible). */
  threshold?: number;
};

/**
 * Wraps a card; on mobile (hover: none), when the card enters the viewport
 * the same hover effect (scale, red border, glow) is applied via CSS.
 */
export function MobileInViewHover({
  children,
  className = "",
  rootMargin = "0px 0px -80px 0px",
  threshold = 0.25,
}: MobileInViewHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setInView(entry.isIntersecting);
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div
      ref={ref}
      className={`mobile-in-view-hover ${inView ? "mobile-in-view-hover-visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
