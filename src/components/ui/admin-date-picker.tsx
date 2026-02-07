"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  "aria-label"?: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE = 80; // e.g. 1970–2050
const YEAR_OPTIONS = Array.from(
  { length: YEAR_RANGE },
  (_, i) => CURRENT_YEAR - Math.floor(YEAR_RANGE / 2) + i
);

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];
  const startDay = first.getDay();
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export function AdminDatePicker({
  value,
  onChange,
  id,
  className = "",
  placeholder = "Select date",
  min,
  max,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const valueDate = value ? new Date(value + "T12:00:00") : null;
  const today = toDateOnly(new Date().toISOString());

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, []);

  useEffect(() => {
    if (value && open) {
      const [y, m] = value.split("-").map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    let timeoutId = 0;
    /* removed duplicate handler */
    function _removed(e: MouseEvent) {
      const target = e.target as Node;
      const isInsidePopover = popoverRef.current?.contains(target);
      const isInsideInput = inputRef.current?.contains(target);
      if (isInsidePopover || isInsideInput) return;
      // t’t trigger close
      // when option is clicked (options render outside our popover in many browsers)
      const raf = requestAnimationFrame(() => {
        const active = document.activeElement;
        const activeInPopover = popoverRef.current?.contains(active);
        const activeIsInput = inputRef.current?.contains(active);
        if (activeInPopover || activeIsInput) return;
        setOpen(false);
      });
    }
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      )
        return;
      timeoutId = window.setTimeout(() => {
        timeoutId = 0;
        const active = document.activeElement;
        if (
          (active && popoverRef.current?.contains(active)) ||
          (active && inputRef.current?.contains(active))
        )
          return;
        setOpen(false);
      }, 50);
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = getDaysInMonth(year, month);
  const monthLabel = `${MONTHS[month]} ${year}`;

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }
  function setMonth(m: number) {
    setViewDate(new Date(year, m, 1));
  }
  function setYear(y: number) {
    setViewDate(new Date(y, month, 1));
  }

  function selectDay(d: number) {
    const y = year;
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    const next = `${y}-${m}-${day}`;
    if (min && next < min) return;
    if (max && next > max) return;
    onChange(next);
    setOpen(false);
  }

  const minDate = min ? new Date(min + "T12:00:00") : null;
  const maxDate = max ? new Date(max + "T12:00:00") : null;

  return (
    <>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={value || ""}
          id={id}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          className={className + " admin-date cursor-pointer pr-10"}
        />
        <span
          className="absolute right-3 pointer-events-none text-white/90"
          aria-hidden
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
      </div>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[100] admin-calendar-popover p-3 min-w-[280px]"
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left,
            }}
          >
            <div className="calendar-header flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="calendar-month-nav shrink-0"
                aria-label="Previous month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="calendar-month-select"
                aria-label="Select month"
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="calendar-year-select"
                aria-label="Select year"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={nextMonth}
                className="calendar-month-nav shrink-0"
                aria-label="Next month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 pt-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="calendar-weekday text-center">
                  {w}
                </div>
              ))}
              {days.map((d, i) => {
                if (d === null) {
                  return <div key={`e-${i}`} />;
                }
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isSelected = value === dateStr;
                const isToday = dateStr === today;
                const dateObj = new Date(year, month, d);
                const isDisabled =
                  (minDate && dateObj < minDate) || (maxDate && dateObj > maxDate);
                const isOtherMonth = false;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectDay(d)}
                    className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${isOtherMonth ? "other-month" : ""}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
