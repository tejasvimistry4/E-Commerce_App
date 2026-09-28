import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useDebounce } from "../../hooks/useDebounce";
import { useSearch } from "../../hooks/useSearch";
import { SuggestionProduct } from "../../types/search";
import { getImageUrl } from "../../utils/image.utils";

export interface SearchAutocompleteProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  onOpenVisualSearch?: () => void;
  placeholder?: string;
  variant?: "navbar" | "page" | "hero";
  className?: string;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  initialQuery = "",
  onSearch,
  onOpenVisualSearch,
  placeholder,
  variant = "page",
  className = "",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlSearchQuery = searchParams.get("search") || "";
  const [query, setQuery] = useState(initialQuery || (location.pathname.startsWith("/products") ? urlSearchQuery : ""));
  const debouncedQuery = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);

  // Consume Redux Search State & Thunk Dispatchers
  const {
    suggestions,
    suggestionsLoading: isLoading,
    searchHistory,
    fetchHistory,
    getSuggestions,
    trackQuery,
    addHistory,
    removeHistory,
    clearHistory: clearSearchHistory,
    clearSuggestions,
    isAuthenticated,
    user,
  } = useSearch();

  // Sync initial query prop and URL search param
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== "") {
      setQuery(initialQuery);
    } else if (location.pathname.startsWith("/products")) {
      setQuery(urlSearchQuery);
    } else if (!urlSearchQuery && variant === "navbar") {
      setQuery("");
    }
  }, [urlSearchQuery, initialQuery, location.pathname, variant]);

  // Clear search input and close dropdown whenever the user logs out or switches accounts
  useEffect(() => {
    if (!isAuthenticated) {
      setQuery("");
      setIsOpen(false);
      clearSuggestions();
    }
  }, [isAuthenticated, user?.id, clearSuggestions]);

  // Dispatch Redux thunk to fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      getSuggestions(debouncedQuery.trim());
    } else {
      clearSuggestions();
    }
  }, [debouncedQuery, getSuggestions, clearSuggestions]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExecuteSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    addHistory(trimmed);
    trackQuery(trimmed);
    setIsOpen(false);

    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClearInput = () => {
    setQuery("");
    setIsOpen(false);
    clearSuggestions();
    if (onSearch) {
      onSearch("");
    } else if (searchParams.has("search") && location.pathname.startsWith("/products")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("search");
      nextParams.delete("page");
      navigate({
        pathname: location.pathname,
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      });
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExecuteSearch(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelectProduct = (product: SuggestionProduct) => {
    addHistory(product.name);
    setIsOpen(false);
    navigate(`/products/slug/${encodeURIComponent(product.slug)}`);
  };

  const handleSelectCategory = (categorySlug: string) => {
    setIsOpen(false);
    navigate(`/products?category=${encodeURIComponent(categorySlug)}`);
  };

  const popularSearches = suggestions?.popularSearches || [];

  const hasSuggestions =
    suggestions &&
    (suggestions.products.length > 0 ||
      suggestions.categories.length > 0 ||
      suggestions.brands.length > 0 ||
      Boolean(suggestions.didYouMean));

  const showRecent = !query.trim() && searchHistory.length > 0;
  const showPopular = (!query.trim() && popularSearches.length > 0) || (suggestions && suggestions.products.length === 0 && popularSearches.length > 0);

  const isNavbar = variant === "navbar";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            fetchHistory();
            getSuggestions(query.trim());
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            (isNavbar
              ? t("nav.searchPlaceholder", "Search laptops, phones, fashion...")
              : t("common.searchPlaceholder", "Search products, brands, categories..."))
          }
          className={`w-full transition-all duration-200 focus:outline-none ${isNavbar
            ? "py-2 pl-9 pr-14 text-xs font-medium rounded-xl bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400"
            : "py-2.5 pl-10 pr-20 text-sm font-medium rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 shadow-xs"
            }`}
          aria-label="Search Products"
        />

        {/* Search Glass Icon */}
        <svg
          className={`absolute text-slate-400 pointer-events-none ${isNavbar ? "left-2.5 w-4 h-4" : "left-3.5 w-4 h-4"
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Clear & Visual Search Action Icons */}
        <div className="absolute right-2 flex items-center space-x-1">
          {query && (
            <button
              type="button"
              onClick={handleClearInput}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {onOpenVisualSearch && (
            <button
              type="button"
              onClick={onOpenVisualSearch}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title={t("visualSearch.title", "Search by image")}
              aria-label={t("visualSearch.title", "Search by image")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-indigo-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${isNavbar ? "w-full sm:w-[440px] md:w-[480px] max-w-[95vw]" : "w-full"
            }`}
        >
          {/* Loading bar indicator */}
          {isLoading && (
            <div className="h-0.5 w-full bg-indigo-100 overflow-hidden">
              <div className="h-full bg-indigo-600 animate-pulse" />
            </div>
          )}

          <div className="p-3 max-h-[460px] overflow-y-auto space-y-4 scrollbar-thin">
            {/* Typo Correction Banner ("Did you mean: ...") */}
            {suggestions?.didYouMean && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <span>💡</span>
                  <span>
                    Did you mean:{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(suggestions.didYouMean!);
                        handleExecuteSearch(suggestions.didYouMean!);
                      }}
                      className="font-bold underline text-amber-900 hover:text-indigo-600 cursor-pointer"
                    >
                      {suggestions.didYouMean}
                    </button>
                    ?
                  </span>
                </div>
              </div>
            )}

            {/* Recent Searches / History Section */}
            {showRecent && (
              <div>
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t("search.recentSearches", "Recent Searches")}</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearSearchHistory}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    {t("search.clearHistory", "Clear all")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {searchHistory.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center pl-3 pr-1.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors group cursor-pointer"
                    >
                      <span
                        onClick={() => {
                          setQuery(item);
                          handleExecuteSearch(item);
                        }}
                        className="mr-1.5 truncate max-w-[140px]"
                      >
                        {item}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistory(item);
                        }}
                        className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Remove from history"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Popular / Trending Searches */}
            {showPopular && (
              <div>
                <div className="px-1 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <span>🔥</span>
                    <span>{t("search.popularSearches", "Trending Searches")}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        handleExecuteSearch(item);
                      }}
                      className="px-3 py-1 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 text-xs font-semibold text-indigo-700 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Categories */}
            {suggestions && suggestions.categories.length > 0 && (
              <div>
                <div className="px-1 mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {t("search.categories", "Categories")}
                  </span>
                </div>
                <div className="space-y-1">
                  {suggestions.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.slug || cat.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-slate-400 group-hover:text-indigo-500">📁</span>
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 font-bold">
                        Browse &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Product Results */}
            {suggestions && suggestions.products.length > 0 && (
              <div>
                <div className="px-1 mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {t("search.products", "Products")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {suggestions.products.length} {t("search.matches", "matches")}
                  </span>
                </div>
                <div className="space-y-1">
                  {suggestions.products.map((p) => {
                    const imgSrc = getImageUrl(p.thumbnail);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/60">
                            {imgSrc ? (
                              <img src={imgSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-black">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {p.name}
                            </p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                              {p.categoryName && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600">
                                  {p.categoryName}
                                </span>
                              )}
                              {p.averageRating > 0 && (
                                <span className="flex items-center text-amber-500 font-bold">
                                  ★ {p.averageRating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-extrabold text-slate-900">
                            ₹{p.price.toLocaleString("en-IN")}
                          </span>
                          {p.comparePrice && p.comparePrice > p.price && (
                            <span className="block text-[10px] text-slate-400 line-through">
                              ₹{p.comparePrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No matches fallback */}
            {query.trim() && !isLoading && !hasSuggestions && (
              <div className="py-6 text-center text-slate-400">
                <span className="text-2xl block mb-1">🔍</span>
                <p className="text-xs font-medium text-slate-600">
                  No exact matches found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try checking for typos or searching by broader keywords.
                </p>
              </div>
            )}
          </div>

          {/* Footer View All Search Results Button */}
          {query.trim() && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => handleExecuteSearch(query)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>
                  {t("search.viewAllFor", { query, defaultValue: `View all results for "${query}"` })}
                </span>
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
