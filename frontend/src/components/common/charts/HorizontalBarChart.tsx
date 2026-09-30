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

export interface HorizontalBarChartProps {
  data: any[];
  dataKey: string;
  barName?: string;
  yAxisKey?: string;
  fill?: string;
  height?: number;
  yAxisWidth?: number;
  showGrid?: boolean;
  valueFormatter?: (value: any, name: string) => string;
  emptyText?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  dataKey,
  barName = "Value",
  yAxisKey = "name",
  fill = "#8b5cf6",
  height = 256,
  yAxisWidth = 100,
  showGrid = true,
  valueFormatter,
  emptyText = "No data recorded",
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
          layout="vertical"
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              horizontal={false}
            />
          )}
          <XAxis
            type="number"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey={yAxisKey}
            type="category"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
          />
          <Tooltip
            content={<CustomChartTooltip valueFormatter={valueFormatter} />}
          />
          <Bar
            dataKey={dataKey}
            name={barName}
            fill={fill}
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HorizontalBarChart;
