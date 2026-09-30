import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CustomChartTooltip } from "./CustomChartTooltip";

export interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface StatusDonutChartProps {
  data: StatusDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  emptyText?: string;
  legendStatusMap?: Record<string, string>;
  valueFormatter?: (value: any, name: string) => string;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  data,
  height = 224,
  innerRadius = 55,
  outerRadius = 80,
  emptyText = "No data recorded yet",
  legendStatusMap,
  valueFormatter,
}) => {
  return (
    <div className="flex flex-col justify-between">
      <div
        className="w-full relative flex items-center justify-center"
        style={{ height }}
      >
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={<CustomChartTooltip valueFormatter={valueFormatter} />}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-xs text-slate-400">{emptyText}</div>
        )}
      </div>

      {/* Optional Status Pill Badges Legend */}
      {legendStatusMap && (
        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-center">
          {Object.entries(legendStatusMap).map(([status, color]) => (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 border border-slate-200/80 text-slate-600"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              {status}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDonutChart;
