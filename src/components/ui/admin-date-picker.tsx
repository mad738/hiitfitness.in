"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const DURATION_CHIPS = [
  { label: "1m", days: 31 },
  { label: "3m", days: 92 },
  { label: "6m", days: 183 },
  { label: "1 year", days: 365 },
] as const;

function parseDateInput(val: string): Date {
  if (!val) return new Date();
  if (val.includes("/")) {
    const [d, m, y] = val.split("/").map(Number);
    return new Date(y, m - 1, 1);
  }
  if (val.includes("-")) {
    const [y, m, d] = val.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  return new Date();
}

function parseDateInputExact(val: string): Date | null {
  if (!val) return null;
  if (val.includes("/")) {
    const [d, m, y] = val.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  if (val.includes("-")) {
    const [y, m, d] = val.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function toDdMmYyyy(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  "aria-label"?: string;
  /** When true, show duration chips (1m, 3m, 6m, 1y) under month/year. Base date = durationChipsReferenceDate or today. */
  showDurationChips?: boolean;
  /** Base date for duration chips (start date). If empty, today is used. */
  durationChipsReferenceDate?: string;
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

function toDateOnly(): string {
  return toDdMmYyyy(new Date());
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

function addDays(dateStr: string, days: number): string {
  const dObj = parseDateInputExact(dateStr) || new Date();
  dObj.setHours(12, 0, 0, 0);
  dObj.setDate(dObj.getDate() + days);
  return toDdMmYyyy(dObj);
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
  showDurationChips = false,
  durationChipsReferenceDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const today = toDateOnly();
  const chipsBaseDate = durationChipsReferenceDate?.trim() || today;
  const [viewDate, setViewDate] = useState(() => parseDateInput(value));
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
      setViewDate(parseDateInput(value));
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
      void requestAnimationFrame(() => {
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
    const nextObj = new Date(year, month, d, 12, 0, 0);
    if (minDate && nextObj < minDate) return;
    if (maxDate && nextObj > maxDate) return;
    onChange(toDdMmYyyy(nextObj));
    setOpen(false);
  }

  const minDate = min ? parseDateInputExact(min) : null;
  const maxDate = max ? parseDateInputExact(max) : null;

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
            {showDurationChips && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10 mt-2">
                {DURATION_CHIPS.map(({ label, days }) => {
                  const endStr = addDays(chipsBaseDate, days);
                  const endObj = parseDateInputExact(endStr);
                  const disabled = Boolean(
                    endObj && ((minDate && endObj < minDate) || (maxDate && endObj > maxDate))
                  );
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onChange(endStr);
                        setViewDate(parseDateInput(endStr));
                        setOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
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
                const dateStr = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
                const isSelected = value === dateStr;
                const isToday = dateStr === today;
                const dateObj = new Date(year, month, d);
                const isDisabled = Boolean(
                  (minDate && dateObj < minDate) || (maxDate && dateObj > maxDate)
                );
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
