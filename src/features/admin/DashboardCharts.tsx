"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const barColor = "rgb(239 68 68)";

export function RevenueChart({ data, title, formatINR, gradientId = "fillRevenue", onBarClick }: Props) {
  const id = gradientId.replace(/\s/g, "-");
  return (
    <div className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:border-brand-red/25 hover:shadow-[0_0_24px_rgba(255,0,0,0.1)]">
      <p className="text-stone-400 text-sm font-medium mb-4">{title}</p>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
              contentStyle={{
                backgroundColor: "rgba(23,23,23,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
              labelStyle={{ color: "#d6d3d1" }}
              formatter={(value: number | undefined) => [formatINR(value ?? 0), "Revenue"]}
              labelFormatter={(label) => label}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill={`url(#${id})`}
              radius={[4, 4, 0, 0]}
              cursor={onBarClick ? "pointer" : "default"}
              onClick={onBarClick ? (_data: unknown, index: number) => onBarClick(index) : undefined}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
