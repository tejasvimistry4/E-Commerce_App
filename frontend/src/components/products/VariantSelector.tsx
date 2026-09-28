import React, { useMemo } from "react";
import { ProductVariant } from "../../types/product";
import { useTranslation } from "../../i18n";

export interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  selectedAttributes: Record<string, string>;
  onSelectAttributes: (attributes: Record<string, string>) => void;
  className?: string;
  compact?: boolean;
}

const COLOR_MAP: Record<string, { bg: string; border?: string }> = {
  black: { bg: "#18181b" },
  "onyx black": { bg: "#09090b" },
  "triple black": { bg: "#000000" },
  "matte black": { bg: "#18181b" },
  white: { bg: "#ffffff", border: "#cbd5e1" },
  "cloud white": { bg: "#f8fafc", border: "#cbd5e1" },
  "arctic white": { bg: "#ffffff", border: "#cbd5e1" },
  navy: { bg: "#1e3a8a" },
  "navy blue": { bg: "#172554" },
  "nordic blue": { bg: "#1d4ed8" },
  blue: { bg: "#2563eb" },
  green: { bg: "#16a34a" },
  "forest green": { bg: "#14532d" },
  "sage green": { bg: "#4d7c0f" },
  orange: { bg: "#ea580c" },
  "solar orange": { bg: "#f97316" },
  red: { bg: "#dc2626" },
  crimson: { bg: "#b91c1c" },
  terracotta: { bg: "#c2410c" },
  grey: { bg: "#64748b" },
  gray: { bg: "#64748b" },
  tan: { bg: "#d97706" },
  brown: { bg: "#78350f" },
  gold: { bg: "#eab308" },
  silver: { bg: "#cbd5e1" },
  pink: { bg: "#ec4899" },
  purple: { bg: "#9333ea" },
  beige: { bg: "#f5f5dc", border: "#d4d4d8" },
};

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariant,
  selectedAttributes,
  onSelectAttributes,
  className = "",
  compact = false,
}) => {
  const { t } = useTranslation();

  if (!variants || variants.length === 0) {
    return null;
  }

  // 1. Discover all unique attribute keys across all variants
  const attributeKeys = useMemo(() => {
    const keysSet = new Set<string>();
    variants.forEach((v) => {
      if (v.attributes) {
        Object.keys(v.attributes).forEach((k) => keysSet.add(k));
      }
    });

    // Custom sorting priority: Color -> Size -> Material -> Other
    const priority = (k: string) => {
      const lower = k.toLowerCase();
      if (lower.includes("color") || lower.includes("colour")) return 1;
      if (lower.includes("size")) return 2;
      if (lower.includes("material")) return 3;
      return 4;
    };

    return Array.from(keysSet).sort((a, b) => priority(a) - priority(b));
  }, [variants]);

  // 2. Discover all distinct values for each attribute key
  const optionsByKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    attributeKeys.forEach((key) => {
      const valsSet = new Set<string>();
      variants.forEach((v) => {
        if (v.attributes && v.attributes[key]) {
          valsSet.add(v.attributes[key]);
        }
      });
      map[key] = Array.from(valsSet);
    });
    return map;
  }, [attributeKeys, variants]);

  // Helper: check availability & stock for a specific option given other currently selected attributes
  const getOptionStatus = (key: string, value: string) => {
    // Other selected attributes except the current key being evaluated
    const otherSelectedEntries = Object.entries(selectedAttributes).filter(
      ([k]) => k !== key
    );

    // Variants that match this option value
    const variantsMatchingThisValue = variants.filter(
      (v) => v.isActive && v.attributes && v.attributes[key] === value
    );
    const existsInCatalog = variantsMatchingThisValue.length > 0;

    // Variants matching this option AND all other currently selected attributes
    const matchingCombinedVariants = variants.filter((v) => {
      if (!v.isActive || !v.attributes || v.attributes[key] !== value) return false;
      return otherSelectedEntries.every(
        ([otherKey, otherVal]) => !otherVal || v.attributes[otherKey] === otherVal
      );
    });

    const isCombinationValid = matchingCombinedVariants.length > 0;
    const inStockVariants = matchingCombinedVariants.filter((v) => v.stock > 0);
    const isCombinationInStock = inStockVariants.length > 0;
    const availableStock = matchingCombinedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

    // If combination is not valid with current selections, is there ANY other combination where this option is in stock?
    const anyInStockWithThisOption = variantsMatchingThisValue.some((v) => v.stock > 0);

    return {
      existsInCatalog,
      isCombinationValid,
      isCombinationInStock,
      isOutOfStock: isCombinationValid && !isCombinationInStock,
      isUnavailable: !isCombinationValid,
      availableStock,
      anyInStockWithThisOption,
    };
  };

  const handleOptionClick = (key: string, value: string) => {
    // 1. Direct candidate attributes
    const candidateAttributes = { ...selectedAttributes, [key]: value };

    // 2. Check if an exact active variant matches this full combination
    const exactMatch = variants.find((v) => {
      if (!v.isActive || !v.attributes) return false;
      return Object.entries(candidateAttributes).every(
        ([k, val]) => v.attributes[k] === val
      );
    });

    if (exactMatch) {
      onSelectAttributes(exactMatch.attributes);
      return;
    }

    // 3. If exact combination does not exist (e.g. user was on Size: "L" and clicked Color: "Black",
    // but Black only has S and M):
    const variantsWithClickedValue = variants.filter(
      (v) => v.isActive && v.attributes && v.attributes[key] === value
    );

    if (variantsWithClickedValue.length > 0) {
      // Find the best variant: prefer in-stock, then default, then first available
      const inStockVariants = variantsWithClickedValue.filter((v) => v.stock > 0);
      const bestVariant =
        inStockVariants.find((v) => v.isDefault) ||
        inStockVariants[0] ||
        variantsWithClickedValue.find((v) => v.isDefault) ||
        variantsWithClickedValue[0];

      if (bestVariant && bestVariant.attributes) {
        onSelectAttributes(bestVariant.attributes);
        return;
      }
    }

    // Fallback
    onSelectAttributes(candidateAttributes);
  };

  const selectedColorName = selectedAttributes["Color"] || selectedAttributes["color"] || "";

  return (
    <div className={`space-y-4 ${className}`}>
      {attributeKeys.map((key) => {
        const values = optionsByKey[key] || [];
        const isColor = key.toLowerCase().includes("color") || key.toLowerCase().includes("colour");
        const isSize = key.toLowerCase().includes("size");
        const currentValue = selectedAttributes[key];

        return (
          <div key={key} className="space-y-2.5">
            {/* Header with selected value label & status pill */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold uppercase tracking-wider text-slate-500">
                  {key}:
                </span>
                <span className="font-black text-slate-900 capitalize">
                  {currentValue || t("common.select", "Select")}
                </span>

                {selectedVariant && selectedVariant.attributes?.[key] === currentValue && (
                  selectedVariant.stock <= 0 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200">
                      {t("common.outOfStock", "Out of Stock")}
                    </span>
                  ) : selectedVariant.stock <= 5 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {t("common.onlyXLeft", { count: selectedVariant.stock, defaultValue: `Only ${selectedVariant.stock} left` })}
                    </span>
                  ) : null
                )}
              </div>


            </div>

            {/* Render Buttons / Swatches */}
            {isColor ? (
              // Color Swatch Grid
              <div className="flex flex-wrap items-center gap-2.5">
                {values.map((val) => {
                  const isSelected = currentValue === val;
                  const status = getOptionStatus(key, val);
                  const lowerVal = val.toLowerCase();
                  const colorConfig = COLOR_MAP[lowerVal] || { bg: "#475569" };

                  let title = val;
                  if (!status.anyInStockWithThisOption) {
                    title = `${val} (${t("common.outOfStock", "Out of Stock")})`;
                  } else if (status.isUnavailable) {
                    title = `${val} (${t("products.clickToSwitch", "Select to view available sizes")})`;
                  }

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleOptionClick(key, val)}
                      title={title}
                      className={`group relative flex items-center gap-2 rounded-2xl transition-all cursor-pointer ${compact ? "p-1.5" : "px-3.5 py-2"
                        } ${isSelected
                          ? "bg-indigo-50/90 border-2 border-indigo-600 text-indigo-950 shadow-xs scale-102 font-black"
                          : "bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                        } ${!status.anyInStockWithThisOption ? "opacity-50" : ""}`}
                    >
                      {/* Color Circle Swatch */}
                      <span
                        className="w-5 h-5 rounded-full shadow-inner border shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: colorConfig.bg,
                          borderColor: colorConfig.border || "rgba(0,0,0,0.15)",
                        }}
                      />

                      {!compact && (
                        <span className="text-xs capitalize">
                          {val}
                        </span>
                      )}

                      {/* Out of stock ping indicator */}
                      {!status.anyInStockWithThisOption && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : isSize ? (
              // Size Button Pills with exact color/size availability filtering
              <div className="flex flex-wrap items-center gap-2">
                {values.map((val) => {
                  const isSelected = currentValue === val;
                  const status = getOptionStatus(key, val);

                  // If size does not exist for current selected color/attributes: disabled
                  const isDisabled = status.isUnavailable;

                  let titleText = val;
                  if (status.isUnavailable) {
                    titleText = selectedColorName
                      ? `${val} - ${t("products.notAvailableInColor", { color: selectedColorName, defaultValue: `Not available in ${selectedColorName}` })}`
                      : `${val} - ${t("products.unavailable", "Unavailable")}`;
                  } else if (status.isOutOfStock) {
                    titleText = `${val} - ${t("common.outOfStock", "Out of Stock")}`;
                  } else {
                    titleText = `${val} (${status.availableStock} ${t("common.inStock", "in stock")})`;
                  }

                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleOptionClick(key, val)}
                      title={titleText}
                      className={`relative min-w-[48px] h-10 px-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center ${isSelected
                          ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20 scale-105 cursor-pointer"
                          : isDisabled
                            ? "opacity-30 line-through decoration-rose-500/80 bg-slate-100 text-slate-400 border border-dashed border-slate-300 cursor-not-allowed"
                            : status.isOutOfStock
                              ? "opacity-55 line-through decoration-slate-400 bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-300 cursor-pointer"
                              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                        }`}
                    >
                      <span>{val}</span>
                      {status.isOutOfStock && !isDisabled && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Material & Other Custom Attributes (Chips)
              <div className="flex flex-wrap items-center gap-2">
                {values.map((val) => {
                  const isSelected = currentValue === val;
                  const status = getOptionStatus(key, val);
                  const isDisabled = status.isUnavailable;

                  let titleText = val;
                  if (status.isUnavailable) {
                    titleText = `${val} - ${t("products.unavailable", "Unavailable")}`;
                  } else if (status.isOutOfStock) {
                    titleText = `${val} - ${t("common.outOfStock", "Out of Stock")}`;
                  }

                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleOptionClick(key, val)}
                      title={titleText}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected
                          ? "bg-indigo-600 text-white shadow-xs scale-102 cursor-pointer"
                          : isDisabled
                            ? "opacity-30 line-through bg-slate-100 text-slate-400 border border-dashed border-slate-300 cursor-not-allowed"
                            : status.isOutOfStock
                              ? "opacity-55 line-through bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                        }`}
                    >
                      <span>✨</span>
                      <span>{val}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VariantSelector;
