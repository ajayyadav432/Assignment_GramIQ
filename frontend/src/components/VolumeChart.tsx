"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyCount } from "@/lib/types";

interface Props {
  data: DailyCount[];
}

export default function VolumeChart({ data }: Props) {
  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formattedData}>
        <defs>
          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          vertical={false}
        />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 12, fill: "#718096" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#718096" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            fontSize: "0.8125rem",
          }}
          formatter={(value: unknown) => [`${value}`, "Predictions"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#2d6a4f"
          strokeWidth={2.5}
          fill="url(#colorVolume)"
          dot={{
            r: 4,
            fill: "#2d6a4f",
            strokeWidth: 2,
            stroke: "white",
          }}
          activeDot={{
            r: 6,
            fill: "#40916c",
            strokeWidth: 2,
            stroke: "white",
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
