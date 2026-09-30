import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CustomChartTooltip } from "./CustomChartTooltip";

export interface AreaSeriesConfig {
  key: string;
  name: string;
  stroke: string;
  fill?: string;
  fillOpacity?: number;
}

export interface AreaTrendChartProps {
  data: any[];
  series: AreaSeriesConfig[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  valueFormatter?: (value: any, name: string) => string;
  emptyText?: string;
}

export const AreaTrendChart: React.FC<AreaTrendChartProps> = ({
  data,
  series,
  xAxisKey = "date",
  height = 288,
  showGrid = true,
  valueFormatter,
  emptyText = "No trend data available",
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
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {series.map((s, idx) => {
              const gradId = `areaGrad-${s.key}-${idx}`;
              const color = s.fill || s.stroke;
              return (
                <linearGradient
                  key={gradId}
                  id={gradId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={color}
                    stopOpacity={s.fillOpacity ?? 0.25}
                  />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              );
            })}
          </defs>

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

          {series.map((s, idx) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.stroke}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#areaGrad-${s.key}-${idx})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaTrendChart;
