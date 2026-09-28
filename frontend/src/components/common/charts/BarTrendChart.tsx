import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CustomChartTooltip } from "./CustomChartTooltip";

export interface BarSeriesConfig {
  key: string;
  name: string;
  fill: string;
  radius?: [number, number, number, number];
}

export interface BarTrendChartProps {
  data: any[];
  bars: BarSeriesConfig[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  valueFormatter?: (value: any, name: string) => string;
  emptyText?: string;
}

export const BarTrendChart: React.FC<BarTrendChartProps> = ({
  data,
  bars,
  xAxisKey = "name",
  height = 256,
  showGrid = true,
  valueFormatter,
  emptyText = "No data available",
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-slate-400"
        style={{ height }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomChartTooltip valueFormatter={valueFormatter} />}
          />

          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name}
              fill={b.fill}
              radius={b.radius || [6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarTrendChart;
