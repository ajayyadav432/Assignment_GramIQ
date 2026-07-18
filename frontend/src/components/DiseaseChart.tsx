"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { DiseaseCount } from "@/lib/types";

// Carefully curated color palette for agricultural diseases
const COLORS = [
  "#2d6a4f",
  "#40916c",
  "#52b788",
  "#74c69d",
  "#95d5b2",
  "#d4a373",
  "#e9c46a",
  "#f4a261",
  "#e76f51",
  "#457b9d",
  "#264653",
  "#a8dadc",
];

interface Props {
  data: DiseaseCount[];
}

export default function DiseaseChart({ data }: Props) {
  // Sort and group tail categories into "Others" to prevent clutter
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort descending by count
    const sorted = [...data].sort((a, b) => b.count - a.count);
    
    if (sorted.length <= 6) {
      return sorted;
    }
    
    const topLimit = 5;
    const topItems = sorted.slice(0, topLimit);
    const othersCount = sorted.slice(topLimit).reduce((sum, item) => sum + item.count, 0);
    
    return [
      ...topItems,
      { disease: "Others", count: othersCount }
    ];
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="disease"
          cx="50%"
          cy="45%"
          outerRadius={85}
          innerRadius={50}
          paddingAngle={3}
          label={({ name, percent }: PieLabelRenderProps) =>
            percent && percent > 0.03
              ? `${name || ""} (${((percent || 0) * 100).toFixed(0)}%)`
              : ""
          }
          labelLine={{ strokeWidth: 1.2, stroke: "#94a3b8" }}
        >
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              strokeWidth={1.5}
              stroke="#fff"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            fontSize: "0.8125rem",
          }}
          formatter={(value: unknown) => [`${value} predictions`, "Count"]}
        />
        <Legend
          wrapperStyle={{ 
            fontSize: "0.75rem",
            paddingTop: "15px"
          }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
