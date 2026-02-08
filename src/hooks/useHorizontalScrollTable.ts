"use client";

import { useRef, useEffect, useCallback } from "react";

export type UseHorizontalScrollTableOptions = {
  /** When true, wheel on table body also scrolls horizontally and prevents background scroll. Default true. */
  wheelOnBody?: boolean;
};

/**
 * Reusable hook for a table with top horizontal scrollbar and header/body wheel → horizontal scroll.
 * Use the returned refs on: topScrollRef (top bar div), tableScrollRef (wrapper around table), headerRef (thead).
 */
/** Stable key for dependency list so we can use array literal in useEffect deps (satisfies react-hooks/exhaustive-deps). */
function depsKey(deps: React.DependencyList): string {
  return deps.map((d) => String(d)).join(",");
}

export function useHorizontalScrollTable(
  deps: React.DependencyList,
  options: UseHorizontalScrollTableOptions = {}
) {
  const { wheelOnBody = true } = options;
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const isSyncingScrollRef = useRef(false);
  const key = depsKey(deps);

  useEffect(() => {
    const topEl = topScrollRef.current;
    const tableEl = tableScrollRef.current;
    if (!topEl || !tableEl) return;
    function syncFromTop() {
      const t = tableScrollRef.current;
      const top = topScrollRef.current;
      if (!t || !top || isSyncingScrollRef.current) return;
      isSyncingScrollRef.current = true;
      t.scrollLeft = top.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    }
    function syncFromTable() {
      const t = tableScrollRef.current;
      const top = topScrollRef.current;
      if (!t || !top || isSyncingScrollRef.current) return;
      isSyncingScrollRef.current = true;
      top.scrollLeft = t.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    }
    topEl.addEventListener("scroll", syncFromTop);
    tableEl.addEventListener("scroll", syncFromTable);
    return () => {
      topEl.removeEventListener("scroll", syncFromTop);
      tableEl.removeEventListener("scroll", syncFromTable);
    };
  }, [key]);

  const onWheel = useCallback((e: WheelEvent) => {
    const tableEl = tableScrollRef.current;
    const topEl = topScrollRef.current;
    if (!tableEl || e.deltaY === 0) return;
    const maxScroll = tableEl.scrollWidth - tableEl.clientWidth;
    if (maxScroll <= 0) return;
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(0, Math.min(maxScroll, tableEl.scrollLeft + e.deltaY));
    tableEl.scrollLeft = next;
    if (topEl) topEl.scrollLeft = next;
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    const tableEl = tableScrollRef.current;
    if (!header || !tableEl) return;
    header.addEventListener("wheel", onWheel, { passive: false });
    return () => header.removeEventListener("wheel", onWheel);
  }, [key, onWheel]);

  useEffect(() => {
    if (!wheelOnBody) return;
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;
    tableEl.addEventListener("wheel", onWheel, { passive: false });
    return () => tableEl.removeEventListener("wheel", onWheel);
  }, [wheelOnBody, key, onWheel]);

  return { tableScrollRef, topScrollRef, headerRef };
}
