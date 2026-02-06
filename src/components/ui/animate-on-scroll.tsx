"use client";

import { useEffect, useRef, useState } from "react";

type AnimateOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before animating (e.g. for stagger). Default 0. */
  delay?: number;
  /** Root margin for Intersection Observer. Default "0px 0px -60px 0px" (trigger when 60px from bottom of viewport). */
  rootMargin?: string;
  /** Only animate once. Default true. */
  once?: boolean;
};

export function AnimateOnScroll({
  children,
  className = "",
  delay = 0,
  rootMargin = "0px 0px -60px 0px",
  once = true,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [delayedShow, setDelayedShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (!once) setInView(false);
            return;
          }
          setInView(true);
        });
      },
      { threshold: 0.1, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin]);

  useEffect(() => {
    if (!inView || delay === 0) {
      if (delay === 0 && inView) setDelayedShow(true);
      return;
    }
    const t = setTimeout(() => setDelayedShow(true), delay);
    return () => clearTimeout(t);
  }, [inView, delay]);

  return (
    <div
      ref={ref}
      className={`animate-in-scroll-placeholder ${delayedShow ? "animate-in-scroll-visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
