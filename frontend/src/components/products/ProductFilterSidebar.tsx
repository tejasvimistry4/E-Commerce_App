import React, { useState, useMemo } from "react";
import { useTranslation } from "../../i18n";
import { SearchFacets } from "../../types/search";

export interface ProductFilterSidebarProps {
  facets: SearchFacets | null;
  selectedSearch?: string;
  onClearSearch?: () => void;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min?: number, max?: number) => void;
  minRating?: number;
  onSelectRating: (rating?: number) => void;
  minDiscount?: number;
  onSelectDiscount: (discount?: number) => void;
  inStockOnly: boolean;
  onToggleInStock: (inStock: boolean) => void;
  selectedAttributes: Record<string, string>;
  onSelectAttribute: (key: string, value: string) => void;
  onClearAll: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  facets,
  selectedSearch,
  onClearSearch,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  minPrice,
  maxPrice,
  onPriceChange,
  minRating,
  onSelectRating,
  minDiscount,
  onSelectDiscount,
  inStockOnly,
  onToggleInStock,
  selectedAttributes,
  onSelectAttribute,
  onClearAll,
  isOpenMobile = false,
  onCloseMobile,
  className = "",
}) => {
  const { t } = useTranslation();

  // Local price input state for smooth typing before applying
  const [localMinPrice, setLocalMinPrice] = useState<string>(
    minPrice !== undefined ? String(minPrice) : ""
  );
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(
    maxPrice !== undefined ? String(maxPrice) : ""
  );

  // Search filter inside Brand list
  const [brandSearch, setBrandSearch] = useState("");

  // Collapsible section toggle state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const handleApplyPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const min = localMinPrice ? Math.max(0, Number(localMinPrice)) : undefined;
    const max = localMaxPrice ? Math.max(0, Number(localMaxPrice)) : undefined;
    onPriceChange(min, max);
  };

  const handleResetPrice = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    onPriceChange(undefined, undefined);
  };

  const filteredBrands = useMemo(() => {
    if (!facets?.brands) return [];
    if (!brandSearch.trim()) return facets.brands;
    return facets.brands.filter((b) =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase().trim())
    );
  }, [facets?.brands, brandSearch]);

  // Determine active filter chips
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (selectedSearch && onClearSearch) {
      chips.push({
        id: "search",
        label: `Search: "${selectedSearch}"`,
        onRemove: onClearSearch,
      });
    }

    if (selectedCategory && facets?.categories) {
      const cat = facets.categories.find(
        (c) => c.id === selectedCategory || c.slug === selectedCategory
      );
      chips.push({
        id: "cat",
        label: `Category: ${cat?.name || selectedCategory}`,
        onRemove: () => onSelectCategory(""),
      });
    }

    if (selectedBrand) {
      chips.push({
        id: "brand",
        label: `Brand: ${selectedBrand}`,
        onRemove: () => onSelectBrand(""),
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const minText = minPrice !== undefined ? `₹${minPrice}` : "₹0";
      const maxText = maxPrice !== undefined ? `₹${maxPrice}` : "Max";
      chips.push({
        id: "price",
        label: `Price: ${minText} - ${maxText}`,
        onRemove: handleResetPrice,
      });
    }

    if (minRating) {
      chips.push({
        id: "rating",
        label: `${minRating}★ & above`,
        onRemove: () => onSelectRating(undefined),
      });
    }

    if (minDiscount) {
      chips.push({
        id: "discount",
        label: `${minDiscount}%+ Off`,
        onRemove: () => onSelectDiscount(undefined),
      });
    }

    if (inStockOnly) {
      chips.push({
        id: "stock",
        label: "In Stock Only",
        onRemove: () => onToggleInStock(false),
      });
    }

    Object.entries(selectedAttributes).forEach(([key, val]) => {
      if (val) {
        chips.push({
          id: `attr-${key}`,
          label: `${key}: ${val}`,
          onRemove: () => onSelectAttribute(key, ""),
        });
      }
    });

    return chips;
  }, [
    selectedSearch,
    onClearSearch,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    inStockOnly,
    selectedAttributes,
    facets,
    onSelectCategory,
    onSelectBrand,
    onSelectRating,
    onSelectDiscount,
    onToggleInStock,
    onSelectAttribute,
  ]);

  const hasActiveFilters = activeChips.length > 0;

  const content = (
    <div className="space-y-6 text-slate-800">
      {/* Header & Clear All Action */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/90">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-black text-slate-900 tracking-tight">
            {t("filters.title", "Filters")}
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200">
              {activeChips.length}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
          >
            {t("filters.clearAll", "Reset All")}
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-200/80">
          {activeChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center space-x-1 pl-2.5 pr-1.5 py-1 rounded-lg bg-indigo-50/80 border border-indigo-200/80 text-[11px] font-bold text-indigo-900 animate-in fade-in"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="hover:bg-indigo-200/70 p-0.5 rounded-full text-indigo-700 hover:text-indigo-950 transition-colors cursor-pointer"
                title="Remove filter"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 1. Category Filter Section */}
      {facets && facets.categories.length > 0 && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => toggleSection("category")}
            className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <span>{t("filters.category", "Category")}</span>
            <span className="text-slate-400 text-[10px]">
              {collapsedSections["category"] ? "＋" : "－"}
            </span>
          </button>

          {!collapsedSections["category"] && (
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
              <button
                type="button"
                onClick={() => onSelectCategory("")}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  !selectedCategory
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{t("categories.allCategories", "All Categories")}</span>
                <span className={`text-[10px] ${!selectedCategory ? "text-indigo-100" : "text-slate-400"}`}>
                  {facets.total}
                </span>
              </button>

              {facets.categories.map((cat) => {
                const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate mr-2">{cat.name}</span>
                    <span className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Brand Filter Section */}
      {facets && facets.brands.length > 0 && (
        <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
          <button
            type="button"
            onClick={() => toggleSection("brand")}
            className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <span>{t("filters.brand", "Brand")}</span>
            <span className="text-slate-400 text-[10px]">
              {collapsedSections["brand"] ? "＋" : "－"}
            </span>
          </button>

          {!collapsedSections["brand"] && (
            <div className="space-y-2">
              {facets.brands.length > 6 && (
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Search brand..."
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              )}

              <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                {filteredBrands.map((b) => {
                  const isChecked = selectedBrand.toLowerCase() === b.name.toLowerCase();
                  return (
                    <label
                      key={b.name}
                      className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer select-none group"
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onSelectBrand(isChecked ? "" : b.name)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <span className="truncate group-hover:text-indigo-600">{b.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{b.count}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Price Range Filter Section */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <span>{t("filters.priceRange", "Price Range")}</span>
          <span className="text-slate-400 text-[10px]">
            {collapsedSections["price"] ? "＋" : "－"}
          </span>
        </button>

        {!collapsedSections["price"] && (
          <form onSubmit={handleApplyPrice} className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  placeholder={facets ? String(facets.priceRange.min) : "Min"}
                  className="w-full pl-6 pr-2 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-bold">to</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  placeholder={facets ? String(facets.priceRange.max) : "Max"}
                  className="w-full pl-6 pr-2 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Apply Price
              </button>
              {(minPrice !== undefined || maxPrice !== undefined) && (
                <button
                  type="button"
                  onClick={handleResetPrice}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 4. Customer Rating Filter Section */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleSection("rating")}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <span>{t("filters.customerRating", "Customer Rating")}</span>
          <span className="text-slate-400 text-[10px]">
            {collapsedSections["rating"] ? "＋" : "－"}
          </span>
        </button>

        {!collapsedSections["rating"] && (
          <div className="space-y-1">
            {[4, 3, 2, 1].map((stars) => {
              const isSelected = minRating === stars;
              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => onSelectRating(isSelected ? undefined : stars)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-amber-50 border border-amber-200 text-amber-900"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="text-amber-500 font-bold">
                      {"★".repeat(stars)}
                      <span className="text-slate-300">{"★".repeat(5 - stars)}</span>
                    </span>
                    <span className="text-xs font-medium text-slate-700">& up</span>
                  </div>
                  {facets && (
                    <span className="text-[10px] text-slate-400">
                      {facets.ratingCounts[stars as 1 | 2 | 3 | 4 | 5] || 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Discount Percentage Filter Section */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleSection("discount")}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <span>{t("filters.discount", "Discount")}</span>
          <span className="text-slate-400 text-[10px]">
            {collapsedSections["discount"] ? "＋" : "－"}
          </span>
        </button>

        {!collapsedSections["discount"] && (
          <div className="grid grid-cols-2 gap-1.5">
            {[10, 20, 30, 50].map((disc) => {
              const isSelected = minDiscount === disc;
              return (
                <button
                  key={disc}
                  type="button"
                  onClick={() => onSelectDiscount(isSelected ? undefined : disc)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200"
                  }`}
                >
                  {disc}% or more
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Availability Filter */}
      <div className="pt-4 border-t border-slate-200/80">
        <label className="flex items-center justify-between px-2 py-1 rounded-xl hover:bg-slate-50 cursor-pointer select-none">
          <span className="text-xs font-bold text-slate-800">
            {t("filters.inStockOnly", "In Stock Only")}
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
          />
        </label>
      </div>

      {/* 7. Dynamic Category-Specific Attributes (RAM, Storage, Size, Color, Material, Capacity, Processor, etc.) */}
      {facets &&
        facets.attributes.map((attrGroup) => {
          const isCollapsed = Boolean(collapsedSections[attrGroup.name]);
          const currentSelected = selectedAttributes[attrGroup.name] || "";

          return (
            <div key={attrGroup.name} className="pt-4 border-t border-slate-200/80 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleSection(attrGroup.name)}
                className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span>{attrGroup.name}</span>
                <span className="text-slate-400 text-[10px]">
                  {isCollapsed ? "＋" : "－"}
                </span>
              </button>

              {!isCollapsed && (
                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                  {attrGroup.values.map((v) => {
                    const isChecked = currentSelected.toLowerCase() === v.value.toLowerCase();
                    return (
                      <label
                        key={v.value}
                        className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer select-none group"
                      >
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              onSelectAttribute(attrGroup.name, isChecked ? "" : v.value)
                            }
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="truncate group-hover:text-indigo-600">{v.value}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{v.count}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className={`hidden lg:block w-72 flex-shrink-0 ${className}`}>
        <div className="sticky top-24 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer Slide-in Modal */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full overflow-y-auto p-5 z-10 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <h3 className="text-base font-extrabold text-slate-900">Filters</h3>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              {content}
            </div>

            <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductFilterSidebar;
