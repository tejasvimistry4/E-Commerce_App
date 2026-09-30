import React from "react";

export interface VariantBadgeProps {
  attributes?: Record<string, string> | null;
  sku?: string | null;
  className?: string;
  compact?: boolean;
}

// Map color names to CSS hex/classes for mini dot preview
const COLOR_MAP: Record<string, string> = {
  black: "#18181b",
  "onyx black": "#09090b",
  "triple black": "#000000",
  "matte black": "#18181b",
  white: "#ffffff",
  "cloud white": "#f8fafc",
  "arctic white": "#ffffff",
  navy: "#1e3a8a",
  "navy blue": "#172554",
  "nordic blue": "#1d4ed8",
  blue: "#2563eb",
  green: "#16a34a",
  "forest green": "#14532d",
  "sage green": "#4d7c0f",
  orange: "#ea580c",
  "solar orange": "#f97316",
  red: "#dc2626",
  crimson: "#b91c1c",
  terracotta: "#c2410c",
  grey: "#64748b",
  gray: "#64748b",
  tan: "#d97706",
  brown: "#78350f",
  gold: "#eab308",
  silver: "#cbd5e1",
  pink: "#ec4899",
  purple: "#9333ea",
  beige: "#f5f5dc",
};

export const VariantBadge: React.FC<VariantBadgeProps> = ({
  attributes,
  sku,
  className = "",
  compact = false,
}) => {
  if (!attributes || Object.keys(attributes).length === 0) {
    if (sku) {
      return (
        <span className={`inline-flex items-center text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md ${className}`}>
          SKU: {sku}
        </span>
      );
    }
    return null;
  }

  const entries = Object.entries(attributes);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {entries.map(([key, value]) => {
        const lowerKey = key.toLowerCase();
        const lowerVal = String(value).toLowerCase();
        const isColor = lowerKey.includes("color") || lowerKey.includes("colour");
        const colorHex = isColor ? COLOR_MAP[lowerVal] : null;

        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-all ${
              compact
                ? "text-[10px] px-2 py-0.5 bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs"
                : "text-xs px-2.5 py-1 bg-white text-slate-800 border-slate-200 shadow-2xs"
            }`}
          >
            {isColor && colorHex && (
              <span
                className="w-2.5 h-2.5 rounded-full border border-slate-300/80 shrink-0 shadow-2xs"
                style={{ backgroundColor: colorHex }}
              />
            )}
            <span className="text-slate-400 font-medium capitalize">{key}:</span>
            <span className="text-slate-900 capitalize">{value}</span>
          </span>
        );
      })}
    </div>
  );
};

export default VariantBadge;
