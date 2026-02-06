"use client";

import * as React from "react";

type CursorFollowerProps = {
  /**
   * When true, hides the follower on coarse pointers (most touch devices).
   * Default: true
   */
  hideOnTouch?: boolean;
  /**
   * CSS z-index for the overlay. Default: 50
   */
  zIndex?: number;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function CursorFollower({
  hideOnTouch = true,
  zIndex = 50,
}: CursorFollowerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const elRef = React.useRef<HTMLDivElement | null>(null);
  const ringRef = React.useRef<HTMLDivElement | null>(null);

  const rafRef = React.useRef<number | null>(null);
  const targetRef = React.useRef({ x: 0, y: 0, visible: false });
  const currentRef = React.useRef({ x: 0, y: 0 });
  const stateRef = React.useRef({
    hoveringInteractive: false,
    pressing: false,
  });

  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    if (!hideOnTouch) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setEnabled(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [hideOnTouch]);

  React.useEffect(() => {
    if (!enabled) return;
    const el = elRef.current;
    const ring = ringRef.current;
    if (!el || !ring) return;

    // Initialize off-screen
    el.style.opacity = "0";
    ring.style.opacity = "0";

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const st = stateRef.current;

      const speed = prefersReducedMotion ? 1 : 0.18;
      current.x = lerp(current.x, target.x, speed);
      current.y = lerp(current.y, target.y, speed);

      const show = target.visible;
      const glowSize = st.hoveringInteractive ? 120 : 80;
      const ringSize = st.hoveringInteractive ? 44 : 34;
      const ringScale = st.pressing ? 0.9 : 1;

      el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate3d(-50%, -50%, 0)`;
      ring.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate3d(-50%, -50%, 0) scale(${ringScale})`;

      el.style.width = `${glowSize}px`;
      el.style.height = `${glowSize}px`;
      ring.style.width = `${ringSize}px`;
      ring.style.height = `${ringSize}px`;

      el.style.opacity = show ? "1" : "0";
      ring.style.opacity = show ? "1" : "0";

      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);

    const onMove = (e: PointerEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      targetRef.current.visible = true;
    };
    const onLeave = () => {
      targetRef.current.visible = false;
    };

    const isInteractive = (node: EventTarget | null) => {
      if (!(node instanceof Element)) return false;
      return Boolean(
        node.closest(
          'a, button, input, select, textarea, [role="button"], [data-cursor-react="true"]',
        ),
      );
    };

    const onOver = (e: PointerEvent) => {
      stateRef.current.hoveringInteractive = isInteractive(e.target);
    };
    const onOut = () => {
      stateRef.current.hoveringInteractive = false;
    };
    const onDown = () => {
      stateRef.current.pressing = true;
    };
    const onUp = () => {
      stateRef.current.pressing = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, prefersReducedMotion]);

  if (!enabled) return null;

  return (
    <>
      {/* Glow blob */}
      <div
        ref={elRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 rounded-full blur-2xl opacity-0 transition-opacity duration-200"
        style={{
          zIndex,
          background:
            "radial-gradient(circle at 30% 30%, rgba(168,85,247,0.55), rgba(34,211,238,0.22), rgba(0,0,0,0) 65%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Crisp ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 rounded-full opacity-0 transition-opacity duration-200"
        style={{
          zIndex: zIndex + 1,
          border: "1px solid rgba(226,232,240,0.65)",
          boxShadow:
            "0 0 0 2px rgba(168,85,247,0.15), 0 0 30px rgba(34,211,238,0.10)",
          background: "rgba(2,6,23,0.20)",
          backdropFilter: "blur(8px)",
        }}
      />
    </>
  );
}

