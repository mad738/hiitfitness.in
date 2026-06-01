"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

type LoaderContextType = {
  isLoading: boolean;
  triggerLoader: () => void;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
}

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  // Initialize to true so that it displays immediately on initial load/refresh
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLoader = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      timeoutRef.current = null;
    }, 3000);
  }, []);

  // Handle the initial mount loading timeout (3 seconds)
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      timeoutRef.current = null;
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Intercept all internal and external link clicks globally
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (target && target.tagName === "A") {
        const href = target.getAttribute("href");
        
        // Exclude telephone, email, javascript triggers, empty hashes, or plain #
        if (
          href &&
          !href.startsWith("tel:") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("javascript:") &&
          href !== "#" &&
          href.trim() !== ""
        ) {
          triggerLoader();
        }
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [triggerLoader]);

  return (
    <LoaderContext.Provider value={{ isLoading, triggerLoader }}>
      {children}
    </LoaderContext.Provider>
  );
}
