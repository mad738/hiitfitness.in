"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type MobileHeaderContextValue = {
  /** On mobile: true when user scrolled down (header hidden); false when scrolled up or near top. */
  headerHidden: boolean;
  isMobile: boolean;
};

const MobileHeaderContext = createContext<MobileHeaderContextValue>({
  headerHidden: false,
  isMobile: false,
});

const SCROLL_THRESHOLD_PX = 8;
const SHOW_HEADER_SCROLL_TOP = 80;

export function useMobileHeader() {
  return useContext(MobileHeaderContext);
}

export function MobileHeaderProvider({ children }: { children: React.ReactNode }) {
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const update = useCallback((scrollY: number) => {
    const prevY = lastY.current;
    lastY.current = scrollY;

    if (scrollY <= SHOW_HEADER_SCROLL_TOP) {
      setHeaderHidden(false);
      return;
    }

    const delta = scrollY - prevY;
    if (delta > SCROLL_THRESHOLD_PX) setHeaderHidden(true);   // scrolled down → hide header
    if (delta < -SCROLL_THRESHOLD_PX) setHeaderHidden(false); // scrolled up → show header
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 767px)");
    const setMobile = () => setIsMobile(mq.matches);
    setMobile();
    mq.addEventListener("change", setMobile);

    const onScroll = () => {
      if (!mq.matches) return;
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        update(window.scrollY);
        ticking.current = false;
      });
    };

    update(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      mq.removeEventListener("change", setMobile);
      window.removeEventListener("scroll", onScroll);
    };
  }, [update]);

  const value: MobileHeaderContextValue = {
    headerHidden: isMobile ? headerHidden : false,
    isMobile,
  };

  return (
    <MobileHeaderContext.Provider value={value}>
      {children}
    </MobileHeaderContext.Provider>
  );
}
