import React from "react";
import { formatPrice } from "../../../utils";

export interface CustomChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  valueFormatter?: (value: any, name: string) => string;
}

export const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xl text-slate-900 text-xs space-y-1.5 backdrop-blur-md z-50 pointer-events-none">
        {label !== undefined && label !== null && (
          <p className="font-bold text-slate-800 pb-1 border-b border-slate-100">
            {label}
          </p>
        )}
        {payload.map((entry: any, index: number) => {
          const entryName = entry.name || entry.dataKey;
          let displayValue = entry.value;

          if (valueFormatter) {
            displayValue = valueFormatter(entry.value, entryName);
          } else if (
            typeof entryName === "string" &&
            (entryName.toLowerCase().includes("revenue") ||
              entryName.toLowerCase().includes("sales") ||
              entryName.toLowerCase().includes("price") ||
              entryName.toLowerCase().includes("total"))
          ) {
            displayValue = formatPrice(entry.value);
          }

          return (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: entry.color || entry.fill || "#6366f1",
                  }}
                />
                {entryName}:
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default CustomChartTooltip;
