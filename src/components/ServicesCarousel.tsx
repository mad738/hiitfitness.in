"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { services, serviceImageFallbacks, type ServiceItem } from "@/data/services";
import { ChevronRight } from "lucide-react";

/* -----------------------------------------------------------------------------
 * MORPHING SERVICES CAROUSEL (4 cards, no prev/next buttons)
 * -----------------------------------------------------------------------------
 * LAYOUT: One active card (center) + three inactive cards; all fit in view.
 * - Active: IMAGE (50%) | CONTENT (50%). Content has a left-edge gradient so
 *   text feels like it emerges from the image.
 * - Inactive: image full-cover, caption at bottom.
 * - Track width sized so one active + three inactives fit; translateX centers
 *   the active card. Click a card or swipe/wheel to change active.
 *
 * TRANSITION: Same ease-in for track slide and card expand (cubic-bezier
 * 0.33, 0, 0.2, 1, 600ms). Content slides in from the image edge.
 * -----------------------------------------------------------------------------
 */

const N = services.length;

/* Desktop */
const GAP = 12;
const INACTIVE_WIDTH = 160;
const INACTIVE_HEIGHT = 200;
const ACTIVE_WIDTH_PX = 640;
const ACTIVE_HEIGHT_PX = 360;
const ACTIVE_WIDTH_VW = 90;

/* Mobile (≤768px): smaller cards and gaps for better fit and touch */
const GAP_MOBILE = 4;
const INACTIVE_WIDTH_MOBILE = 88;
const INACTIVE_HEIGHT_MOBILE = 132;
const ACTIVE_HEIGHT_MOBILE = 260;
const MOBILE_BREAKPOINT = 768;
/* Small mobile (≤400px): maximize active card, minimal inactives */
const GAP_SMALL = 2;
const INACTIVE_WIDTH_SMALL = 72;
const INACTIVE_HEIGHT_SMALL = 110;
const ACTIVE_HEIGHT_SMALL = 240;
const SMALL_MOBILE_BREAKPOINT = 400;

const TRANSITION_MS = 600;
/* Ease-in style: smooth start, natural finish for slide + expand */
const EASING = "cubic-bezier(0.33, 0, 0.2, 1)";
const AUTOPLAY_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD = 40;
const DRAG_THRESHOLD = 8;

/**
 * Total width of the track: 4 cards = 3*(inactive+gap) + activeWidth.
 */
function getTotalTrackWidth(
  activeWidth: number,
  inactiveWidth: number,
  gap: number
): number {
  return 3 * (inactiveWidth + gap) + activeWidth;
}

/**
 * Compute track translateX so the active card is centered when possible.
 * Clamped so the track never leaves the container: all four cards stay visible
 * when the first or last card is active (no empty space at edges).
 */
function getTrackTranslateX(
  activeIndex: number,
  containerWidth: number,
  activeWidth: number,
  inactiveWidth: number,
  gap: number
): number {
  const totalTrack = getTotalTrackWidth(activeWidth, inactiveWidth, gap);
  const inactiveTotal = activeIndex * (inactiveWidth + gap);
  const activeCardCenter = inactiveTotal + activeWidth / 2;
  const viewportCenter = containerWidth / 2;
  const centered = viewportCenter - activeCardCenter;
  const minX = Math.min(0, containerWidth - totalTrack);
  const maxX = Math.max(0, containerWidth - totalTrack);
  return Math.max(minX, Math.min(maxX, centered));
}

export function ServicesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const [activeCardWidth, setActiveCardWidth] = useState(ACTIVE_WIDTH_PX);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef(0);
  const didSwipe = useRef(false);
  const isHorizontalDrag = useRef(false);

  /* Responsive dimensions: small mobile → mobile → desktop */
  const gap = isSmallMobile ? GAP_SMALL : isMobile ? GAP_MOBILE : GAP;
  const inactiveWidth = isSmallMobile ? INACTIVE_WIDTH_SMALL : isMobile ? INACTIVE_WIDTH_MOBILE : INACTIVE_WIDTH;
  const inactiveHeight = isSmallMobile ? INACTIVE_HEIGHT_SMALL : isMobile ? INACTIVE_HEIGHT_MOBILE : INACTIVE_HEIGHT;
  const activeHeight = isSmallMobile ? ACTIVE_HEIGHT_SMALL : isMobile ? ACTIVE_HEIGHT_MOBILE : ACTIVE_HEIGHT_PX;

  const go = useCallback((delta: number) => {
    setActiveIndex((prev) => (prev + delta + N) % N);
  }, []);

  const goPrev = useCallback(() => go(-1), [go]);
  const goNext = useCallback(() => go(1), [go]);

  const handleCardClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Mobile breakpoints (useLayoutEffect to avoid flash on mobile)
  useLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const smq = window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT}px)`);
    const set = () => {
      setIsMobile(mq.matches);
      setIsSmallMobile(smq.matches);
    };
    set();
    mq.addEventListener("change", set);
    smq.addEventListener("change", set);
    return () => {
      mq.removeEventListener("change", set);
      smq.removeEventListener("change", set);
    };
  }, []);

  // Measure container; on mobile use smaller inactives so active card gets more width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 800;
      setContainerWidth(w);
      if (typeof window === "undefined") return;
      const small = window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT}px)`).matches;
      const mobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
      const gapVal = small ? GAP_SMALL : mobile ? GAP_MOBILE : GAP;
      const inactW = small ? INACTIVE_WIDTH_SMALL : mobile ? INACTIVE_WIDTH_MOBILE : INACTIVE_WIDTH;
      const padding = small ? 12 : mobile ? 16 : 24;
      const maxActive = Math.max(200, w - 3 * (inactW + gapVal) - padding);
      setActiveCardWidth(
        mobile
          ? Math.min(w - padding * 2, maxActive)
          : Math.min(ACTIVE_WIDTH_PX, maxActive, (ACTIVE_WIDTH_VW / 100) * window.innerWidth)
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Autoplay – pause when user is interacting (hover handled via onPointerEnter)
  useEffect(() => {
    if (autoplayPaused) return;
    autoplayRef.current = setInterval(() => goNext(), AUTOPLAY_INTERVAL_MS);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [autoplayPaused, goNext]);

  // Horizontal wheel: advance/prev on shift+wheel or wheel with deltaX if supported
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        if (e.deltaY > 0) goNext();
        else if (e.deltaY < 0) goPrev();
        return;
      }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        if (e.deltaX > 0) goPrev();
        else goNext();
      }
    },
    [goNext, goPrev]
  );

  // Touch / pointer swipe
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    didSwipe.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > DRAG_THRESHOLD) setIsDragging(true);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        didSwipe.current = true;
        if (dx > 0) goPrev();
        else goNext();
      }
      setIsDragging(false);
      isHorizontalDrag.current = false;
    },
    [goPrev, goNext]
  );

  // On mobile: prevent vertical scroll when user is swiping carousel horizontally
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (isHorizontalDrag.current && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  const trackTranslateX = getTrackTranslateX(
    activeIndex,
    containerWidth,
    activeCardWidth,
    inactiveWidth,
    gap
  );

  // Mobile: staggered grid (1 large + 3 small) like a photo gallery
  if (isMobile) {
    return (
      <div ref={containerRef} className="relative w-full px-3 sm:px-4">
        <MobileGridCarousel
          activeIndex={activeIndex}
          onSelect={handleCardClick}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none px-4 sm:px-8 touch-pan-y"
      style={{ touchAction: "pan-y" }}
      onPointerEnter={() => setAutoplayPaused(true)}
      onPointerLeave={() => setAutoplayPaused(false)}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Carousel area: fixed height so card expand/shrink doesn’t cause vertical jump */}
      <div
        className="relative flex items-center"
        style={{ minHeight: activeHeight + (isSmallMobile ? 24 : 32) }}
      >
        <div
          ref={trackRef}
          className="flex justify-start py-3 px-2 sm:py-6 sm:px-4"
          style={{
            gap: `${gap}px`,
            height: activeHeight + (isSmallMobile ? 24 : 32),
            alignItems: "center",
            transform: `translateX(${trackTranslateX}px)`,
            transition: isDragging
              ? "none"
              : `transform ${TRANSITION_MS}ms ${EASING}`,
            willChange: "transform",
          }}
        >
          {services.map((service, index) => (
            <div
              key={`slot-${index}`}
              className="flex items-center justify-center flex-shrink-0"
              style={{ height: activeHeight }}
            >
              <MorphCard
                service={service}
                index={index}
                isActive={index === activeIndex}
                isDragging={isDragging}
                activeCardWidth={activeCardWidth}
                inactiveWidth={inactiveWidth}
                inactiveHeight={inactiveHeight}
                activeHeight={activeHeight}
                fallbackImage={serviceImageFallbacks[index]}
                onSelect={() => {
                  if (!didSwipe.current) handleCardClick(index);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center items-center gap-2 sm:gap-2.5 mt-4 sm:mt-5 px-2 pb-1" aria-hidden>
        {services.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-2.5 sm:h-2.5 rounded-full flex items-center justify-center transition-all duration-200 ${i === activeIndex
              ? "bg-[#EE2A24] scale-110 sm:scale-125 shadow-[0_0_0_2px_rgba(238,42,36,0.3)]"
              : "bg-stone-300 hover:bg-stone-400 active:bg-stone-500"
              }`}
            aria-label={`Go to ${services[i].title}`}
            aria-current={i === activeIndex ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * MOBILE GRID CAROUSEL
 * Staggered grid: 1 large featured card (2/3 width) + 3 small thumbnails.
 * Tap a small card to make it the featured one. Rounded corners, compact layout.
 * -----------------------------------------------------------------------------
 */
function MobileGridCarousel({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  /**
   * Smooth mobile morph (no libraries):
   * We render all 4 tiles at all times, but their *grid slot* changes based on
   * `activeIndex`. Grid reflow is not animatable, so we use a FLIP animation:
   * - First: record previous rects
   * - Last:  record new rects after React repositions tiles
   * - Invert: apply a transform that visually keeps tiles in the old place
   * - Play:  animate transform back to identity
   *
   * This makes movement + resizing feel like a single smooth morph.
   */
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevRectsRef = useRef<Map<number, DOMRect>>(new Map());
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    prefersReducedMotionRef.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  const order = services.map((_, i) => i).filter((i) => i !== activeIndex);
  const slotByIndex = new Map<number, "featured" | "top" | "mid" | "bottom">([
    [activeIndex, "featured"],
    [order[0], "top"],
    [order[1], "mid"],
    [order[2], "bottom"],
  ]);

  const measureRects = useCallback(() => {
    const rects = new Map<number, DOMRect>();
    for (let i = 0; i < services.length; i += 1) {
      const el = tileRefs.current[i];
      if (!el) continue;
      rects.set(i, el.getBoundingClientRect());
    }
    return rects;
  }, []);

  useLayoutEffect(() => {
    // After DOM updates (tiles moved to new grid slots), run FLIP.
    if (prefersReducedMotionRef.current) {
      prevRectsRef.current = measureRects();
      return;
    }

    const newRects = measureRects();
    const oldRects = prevRectsRef.current;

    for (let i = 0; i < services.length; i += 1) {
      const el = tileRefs.current[i];
      const newRect = newRects.get(i);
      const oldRect = oldRects.get(i);
      if (!el || !newRect || !oldRect) continue;

      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      const sx = oldRect.width / newRect.width;
      const sy = oldRect.height / newRect.height;

      // Only apply inversion when something actually changed.
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
        continue;
      }

      el.style.transition = "none";
      el.style.transformOrigin = "top left";
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    }

    // Force a reflow so the browser acknowledges the inverted transform.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tileRefs.current[activeIndex]?.offsetHeight;

    requestAnimationFrame(() => {
      for (let i = 0; i < services.length; i += 1) {
        const el = tileRefs.current[i];
        if (!el) continue;
        el.style.transition = `transform 520ms ${EASING}`;
        el.style.transform = "";
      }
    });

    prevRectsRef.current = newRects;
  }, [activeIndex, measureRects]);

  useLayoutEffect(() => {
    // Initial snapshot
    prevRectsRef.current = measureRects();
  }, [measureRects]);

  return (
    <div
      className="grid gap-2 grid-cols-[2fr_1fr] grid-rows-[1fr_1fr_0.5fr] aspect-[3/3] max-h-[400px] w-full"
      style={{ minHeight: 260 }}
    >
      {services.map((service, i) => {
        const slot = slotByIndex.get(i) ?? "bottom";
        const isFeatured = slot === "featured";
        const gridClass =
          slot === "featured"
            ? "col-start-1 row-start-1 row-end-3"
            : slot === "top"
              ? "col-start-2 row-start-1"
              : slot === "mid"
                ? "col-start-2 row-start-2"
                : "col-start-1 col-end-3 row-start-3";

        const fallback = serviceImageFallbacks[i];

        return (
          <button
            key={service.title}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            type="button"
            onClick={() => onSelect(i)}
            className={[
              "relative min-h-0 text-left overflow-hidden bg-white border border-stone-200",
              // Smooth shape / depth morph:
              "transition-[border-radius,box-shadow,border-color] duration-500 ease-out",
              isFeatured
                ? "rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.15)] border-[#EE2A24]/50"
                : "rounded-xl shadow-md hover:border-red-200",
              gridClass,
            ].join(" ")}
            style={{ willChange: "transform" }}
            aria-label={isFeatured ? `${service.title} – featured` : `View ${service.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={service.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallback;
              }}
            />

            {/* Overlay (consistent) */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-white/45 via-white/20 to-transparent"
              aria-hidden
            />

            {/* Featured content vs thumb content (smooth fade/slide) */}
            <div className="relative h-full w-full">
              <div
                className="absolute inset-x-0 bottom-0 p-3"
                style={{
                  opacity: isFeatured ? 1 : 0,
                  transform: isFeatured ? "translateX(0)" : "translateX(-18px)",
                  transition: `opacity 420ms ${EASING}, transform 420ms ${EASING}`,
                  willChange: "opacity, transform",
                }}
              >
                <h3 className="font-display font-bold text-stone-900 text-lg drop-shadow-sm">
                  {service.title}
                </h3>
                <p className="text-stone-700 text-xs leading-snug line-clamp-2 drop-shadow-sm">
                  {service.description}
                </p>
              </div>

              <div
                className="absolute inset-x-0 bottom-0 px-2 py-1.5"
                style={{
                  opacity: isFeatured ? 0 : 1,
                  transform: isFeatured ? "translateX(14px)" : "translateX(0)",
                  transition: `opacity 260ms ${EASING}, transform 260ms ${EASING}`,
                  willChange: "opacity, transform",
                }}
              >
                <span className="text-stone-900 font-semibold text-xs truncate block w-full drop-shadow-sm">
                  {service.title}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * MORPH CARD
 * - Inactive: narrow rectangle, image full-cover, caption at bottom.
 * - Active: wide card, image 50%, content 50% (title, description, CTA).
 * - All transitions via CSS (no conditional unmount) so layout morphs smoothly.
 * -----------------------------------------------------------------------------
 */

interface MorphCardProps {
  service: ServiceItem;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  activeCardWidth: number;
  inactiveWidth: number;
  inactiveHeight: number;
  activeHeight: number;
  fallbackImage: string;
  onSelect: () => void;
}

function MorphCard({
  service,
  isActive,
  isDragging,
  activeCardWidth,
  inactiveWidth,
  inactiveHeight,
  activeHeight,
  fallbackImage,
  onSelect,
}: MorphCardProps) {
  const [imgSrc, setImgSrc] = useState(service.image);

  useEffect(() => {
    setImgSrc(service.image);
  }, [service.image]);

  const cardWidth = isActive ? activeCardWidth : inactiveWidth;
  const cardHeight = isActive ? activeHeight : inactiveHeight;

  return (
    <button
      type="button"
      className={`
        flex-shrink-0 flex overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl
        bg-white border shadow-xl text-left
        focus:outline-none focus:ring-2 focus:ring-[#EE2A24]/50 focus:ring-offset-2 focus:ring-offset-white
        ${isActive ? "border-[#EE2A24]/40 shadow-[0_0_0_1px_rgba(238,42,36,0.2),0_24px_48px_rgba(0,0,0,0.1)]" : "border-stone-200"}
      `}
      style={{
        width: cardWidth,
        height: cardHeight,
        transformOrigin: "center center",
        transition: isDragging
          ? "none"
          : `width ${TRANSITION_MS}ms ${EASING}, height ${TRANSITION_MS}ms ${EASING}, transform ${TRANSITION_MS}ms ${EASING}, opacity ${TRANSITION_MS}ms ${EASING}, box-shadow ${TRANSITION_MS}ms ${EASING}, border-color ${TRANSITION_MS}ms ${EASING}`,
        opacity: isActive ? 1 : 0.85,
        transform: isActive ? "scale(1)" : "scale(0.92)",
        zIndex: isActive ? 20 : 10,
        willChange: "width, height, opacity, transform",
      }}
      onClick={onSelect}
      aria-label={isActive ? `${service.title} – current` : `View ${service.title}`}
    >
      {/* Inner flex: image + content. Inactive = image 100%; active = image 50% + content 50% */}
      <div
        className="flex w-full h-full min-w-0"
        style={{
          transition: `none`,
        }}
      >
        {/* Image half – always present; when inactive it fills the card */}
        <div
          className="relative flex-shrink-0 bg-stone-900 overflow-hidden"
          style={{
            width: isActive ? "50%" : "100%",
            transition: isDragging ? "none" : `width ${TRANSITION_MS}ms ${EASING}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgSrc(fallbackImage)}
          />
          {/* Caption overlay: only visible when inactive (single line) */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/40 to-transparent px-2 py-1.5 sm:px-3 sm:py-2 flex items-end"
            style={{
              opacity: isActive ? 0 : 1,
              transition: isDragging ? "none" : `opacity ${TRANSITION_MS}ms ${EASING}`,
              pointerEvents: isActive ? "none" : "auto",
            }}
          >
            <span className="text-stone-900 font-semibold text-xs sm:text-sm truncate block">
              {service.title}
            </span>
          </div>
        </div>

        {/* Content: panel opens so text can slide in from image (left); no width “curtain” from right */}
        <div
          className="flex flex-col flex-1 min-w-0 justify-center overflow-visible relative"
          style={{
            width: isActive ? "50%" : "0%",
            minWidth: isActive ? undefined : 0,
            transition: isDragging
              ? "none"
              : `width ${TRANSITION_MS}ms ${EASING}, min-width ${TRANSITION_MS}ms ${EASING}`,
          }}
        >
          {/* Clip so text only visible in content area; gradient blends image → text */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none z-[1]"
            style={{
              background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.15) 15%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0.7) 60%)",
            }}
            aria-hidden
          />
          {/* Text: originates from image (left), slides right and fades in; fully visible at final position */}
          <div
            className="relative z-[2] p-3 sm:p-6 md:p-8"
            style={{
              transform: isActive ? "translateX(0)" : "translateX(-180px)",
              opacity: isActive ? 1 : 0,
              transition: isDragging
                ? "none"
                : `transform 500ms ${EASING}, opacity 500ms ease-out`,
              willChange: "transform, opacity",
            }}
          >
            <h3 className="font-display text-base sm:text-xl md:text-2xl font-bold text-stone-900 mb-0.5 sm:mb-2 drop-shadow-sm">
              {service.title}
            </h3>
            <p className="text-stone-700 text-xs sm:text-sm md:text-base leading-relaxed mb-2 sm:mb-4 drop-shadow-sm min-h-[2.5em] sm:min-h-0">
              {service.description}
            </p>
            <span className="inline-flex items-center text-brand-red font-semibold text-xs sm:text-sm hover:underline">
              Learn more
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
