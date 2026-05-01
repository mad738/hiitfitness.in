"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  type TooltipProps,
} from "recharts";

export type RevenueChartRow = {
  label: string;
  revenue: number;
};

type Props = {
  data: RevenueChartRow[];
  title: string;
  formatINR: (value: number) => string;
  /** Unique id for the gradient (use when multiple charts on page). */
  gradientId?: string;
  /** Called when a bar is clicked; receives index in data array. */
  onBarClick?: (index: number) => void;
};

const barColor = "#EE2A24";
const lineColor = "#F9DB6D";

export function RevenueChart({ data, title, formatINR, gradientId = "fillRevenue", onBarClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setChartWidth(Math.max(0, Math.floor(container.clientWidth)));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const maxRevenue = data.reduce((max, row) => Math.max(max, row.revenue), 0);
  const hitboxValue = maxRevenue > 0 ? maxRevenue : 1;
  const chartData: Array<RevenueChartRow & { __hitbox: number }> = data.map((row) => ({
    ...row,
    __hitbox: hitboxValue,
  }));
  const renderTooltip = (tooltipProps: TooltipProps<number, string>) => {
    const active = "active" in tooltipProps ? tooltipProps.active : false;
    const payload = "payload" in tooltipProps ? tooltipProps.payload : undefined;
    const label = "label" in tooltipProps ? tooltipProps.label : undefined;
    if (!active || !payload || !Array.isArray(payload) || payload.length === 0) return null;
    const revenueEntry = payload.find((entry) => entry.dataKey === "revenue");
    if (!revenueEntry) return null;
    const value = typeof revenueEntry.value === "number" ? revenueEntry.value : Number(revenueEntry.value ?? 0);
    return (
      <div className="rounded-xl border border-white/10 bg-stone-900/95 px-3 py-2 text-sm text-stone-200">
        <p className="font-medium">{typeof label === "string" ? label : String(label ?? "")}</p>
        <p className="text-stone-400">Revenue: {formatINR(Number.isFinite(value) ? value : 0)}</p>
      </div>
    );
  };
  const id = gradientId.replace(/\s/g, "-");
  return (
    <div className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:border-brand-red/25 hover:shadow-[0_0_24px_rgba(238,42,36,0.1)]">
      <p className="text-stone-400 text-sm font-medium mb-4">{title}</p>
      <div ref={containerRef} className="h-[260px] w-full min-w-0">
        {chartWidth > 0 && (
          <BarChart
            width={chartWidth}
            height={260}
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barGap={onBarClick ? "-100%" : undefined}
            barCategoryGap={onBarClick ? "0%" : undefined}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={barColor} stopOpacity={0.9} />
                <stop offset="100%" stopColor={barColor} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#a8a29e", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a8a29e", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              content={renderTooltip}
            />
            {onBarClick && (
              <Bar
                dataKey="__hitbox"
                fill="rgba(0,0,0,0)"
                stroke="rgba(0,0,0,0)"
                isAnimationActive={false}
                cursor="pointer"
                onClick={(_data: unknown, index: number) => onBarClick(index)}
              />
            )}
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill={`url(#${id})`}
              radius={[4, 4, 0, 0]}
              cursor={onBarClick ? "pointer" : "default"}
              onClick={onBarClick ? (_data: unknown, index: number) => onBarClick(index) : undefined}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{ r: 3.5, stroke: "#fff", strokeWidth: 1, fill: lineColor }}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 1.5, fill: lineColor }}
            />
          </BarChart>
        )}
      </div>
    </div>
  );
}
