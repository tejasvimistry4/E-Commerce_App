import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchProducts } from "../../redux/products/productSlice";
import { fetchCategories } from "../../redux/categories/categorySlice";
import { ProductCard } from "../../components/products/ProductCard";
import { SearchByImageModal } from "../../components/products/SearchByImageModal";
import { ProductFilterSidebar } from "../../components/products/ProductFilterSidebar";
import { EmptyState, Button, Pagination, Select, Breadcrumb } from "../../components/common";
import { VisualSearchResult } from "../../types/visualSearch";
import { useSearch } from "../../hooks/useSearch";
import { getHighlyInterestedProductsApi } from "../../api/visit.api";

export const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { products, pagination, didYouMean, loading } = useAppSelector((state) => state.products);
  const { categories } = useAppSelector((state) => state.categories);
  const { facets, getFacets } = useSearch();

  const [highlyInterestedMap, setHighlyInterestedMap] = useState<Record<string, number>>({});
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Filter State parsed from URL parameters
  const activeCategoryParam = slug || searchParams.get("category") || searchParams.get("categorySlug") || "";
  const activeSearchParam = searchParams.get("search") || "";
  const activeBrandParam = searchParams.get("brand") || "";
  const activeMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const activeMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const activeMinRating = searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined;
  const activeMinDiscount = searchParams.get("discount") ? Number(searchParams.get("discount")) : undefined;
  const activeInStockOnly = searchParams.get("inStock") === "true";
  const activeSortBy = (searchParams.get("sortBy") as any) || "createdAt";
  const activeSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const activePage = searchParams.get("page") ? Math.max(1, Number(searchParams.get("page"))) : 1;

  // Extract dynamic attribute filters from query params (e.g., attr_RAM=16GB)
  const activeAttributes = useMemo(() => {
    const attrs: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith("attr_") && val) {
        const attrName = key.replace("attr_", "");
        attrs[attrName] = val;
      }
    });
    return attrs;
  }, [searchParams]);

  // Visual Search state from modal or navigation
  const [isVisualModalOpen, setIsVisualModalOpen] = useState<boolean>(false);
  const [visualMatches, setVisualMatches] = useState<VisualSearchResult[] | null>(
    location.state?.visualSearchResults || null
  );
  const [queryImageUrl, setQueryImageUrl] = useState<string | null>(
    location.state?.queryImageUrl || null
  );

  // Update visual matches if location state changes
  useEffect(() => {
    if (location.state?.visualSearchResults) {
      setVisualMatches(location.state.visualSearchResults);
      setQueryImageUrl(location.state.queryImageUrl || null);
    }
  }, [location.state]);

  // Initial load categories
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Load logged-in user's highly interested products map
  useEffect(() => {
    if (!isAuthenticated) {
      setHighlyInterestedMap({});
      return;
    }

    let isMounted = true;
    getHighlyInterestedProductsApi(100)
      .then((res) => {
        if (isMounted && res.success && res.items) {
          const map: Record<string, number> = {};
          res.items.forEach((item) => {
            map[item.productId] = item.visitCount;
          });
          setHighlyInterestedMap(map);
        }
      })
      .catch((err) => {
        console.warn("Could not load highly interested map:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Fetch dynamic facets whenever Category or Search changes via Redux
  useEffect(() => {
    getFacets({
      search: activeSearchParam || undefined,
      categoryId: activeCategoryParam || undefined,
      categorySlug: activeCategoryParam || undefined,
      brand: activeBrandParam || undefined,
      minPrice: activeMinPrice,
      maxPrice: activeMaxPrice,
    });
  }, [getFacets, activeCategoryParam, activeSearchParam, activeBrandParam, activeMinPrice, activeMaxPrice]);

  // Fetch products whenever filters or pagination changes (when visual search is not active)
  useEffect(() => {
    if (!visualMatches) {
      dispatch(
        fetchProducts({
          search: activeSearchParam.trim() || undefined,
          categoryId: activeCategoryParam || undefined,
          categorySlug: activeCategoryParam || undefined,
          brand: activeBrandParam || undefined,
          minPrice: activeMinPrice,
          maxPrice: activeMaxPrice,
          minRating: activeMinRating,
          minDiscount: activeMinDiscount,
          inStockOnly: activeInStockOnly || undefined,
          attributes: Object.keys(activeAttributes).length > 0 ? activeAttributes : undefined,
          sortBy: activeSortBy,
          sortOrder: activeSortOrder,
          page: activePage,
          limit: 12,
        })
      );
    }
  }, [
    dispatch,
    activeSearchParam,
    activeCategoryParam,
    activeBrandParam,
    activeMinPrice,
    activeMaxPrice,
    activeMinRating,
    activeMinDiscount,
    activeInStockOnly,
    activeAttributes,
    activeSortBy,
    activeSortOrder,
    activePage,
    visualMatches,
  ]);

  // Helper to update search params while preserving existing ones
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | undefined | null>, resetPage = true) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === null || val === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(val));
        }
      });

      if (resetPage) {
        nextParams.delete("page");
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  // Filter actions
  const handleSearch = (newSearch: string) => {
    setVisualMatches(null);
    setQueryImageUrl(null);
    updateUrlParams({ search: newSearch.trim() || undefined });
  };

  const handleCategorySelect = (categoryId: string) => {
    setVisualMatches(null);
    setQueryImageUrl(null);
    if (slug) {
      if (categoryId) {
        navigate(`/products?category=${categoryId}`);
      } else {
        navigate("/products");
      }
    } else {
      updateUrlParams({ category: categoryId });
    }
  };

  const handleBrandSelect = (brand: string) => {
    updateUrlParams({ brand });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    updateUrlParams({ minPrice: min, maxPrice: max });
  };

  const handleRatingSelect = (rating?: number) => {
    updateUrlParams({ rating });
  };

  const handleDiscountSelect = (discount?: number) => {
    updateUrlParams({ discount });
  };

  const handleToggleInStock = (inStock: boolean) => {
    updateUrlParams({ inStock: inStock ? "true" : undefined });
  };

  const handleAttributeSelect = (key: string, value: string) => {
    updateUrlParams({ [`attr_${key}`]: value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "price_asc") {
      updateUrlParams({ sortBy: "price", sortOrder: "asc" });
    } else if (value === "price_desc") {
      updateUrlParams({ sortBy: "price", sortOrder: "desc" });
    } else if (value === "rating_desc") {
      updateUrlParams({ sortBy: "rating", sortOrder: "desc" });
    } else if (value === "discount_desc") {
      updateUrlParams({ sortBy: "discount", sortOrder: "desc" });
    } else if (value === "name_asc") {
      updateUrlParams({ sortBy: "name", sortOrder: "asc" });
    } else if (value === "name_desc") {
      updateUrlParams({ sortBy: "name", sortOrder: "desc" });
    } else {
      updateUrlParams({ sortBy: "createdAt", sortOrder: "desc" });
    }
  };

  const clearVisualSearch = () => {
    setVisualMatches(null);
    setQueryImageUrl(null);
    if (location.state) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  };

  const clearAllFilters = () => {
    setVisualMatches(null);
    setQueryImageUrl(null);
    if (slug) {
      navigate("/products");
    } else {
      setSearchParams({});
    }
  };

  // Find currently active category object if any
  const currentCategory = categories.find(
    (c) => c.id === activeCategoryParam || c.slug === activeCategoryParam
  );

  const rootCategories = useMemo(
    () => categories.filter((cat) => !cat.parentId),
    [categories]
  );

  // Active filters count for mobile filter badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategoryParam) count++;
    if (activeBrandParam) count++;
    if (activeMinPrice !== undefined || activeMaxPrice !== undefined) count++;
    if (activeMinRating !== undefined) count++;
    if (activeMinDiscount !== undefined) count++;
    if (activeInStockOnly) count++;
    count += Object.keys(activeAttributes).length;
    return count;
  }, [
    activeCategoryParam,
    activeBrandParam,
    activeMinPrice,
    activeMaxPrice,
    activeMinRating,
    activeMinDiscount,
    activeInStockOnly,
    activeAttributes,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header Banner & Global Autocomplete Search */}
      <section className="relative overflow-hidden pt-10 pb-12 border-b border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            className="mb-6"
            items={[
              { label: t("nav.home", "Home"), to: "/" },
              ...(currentCategory
                ? [
                    {
                      label: t("products.catalog", "Products Catalog"),
                      to: "/products",
                      onClick: () => handleCategorySelect(""),
                    },
                    {
                      label: currentCategory.name,
                      active: true,
                      className: "!text-indigo-700 font-bold",
                    },
                  ]
                : [{ label: t("products.catalog", "Products Catalog"), active: true }]),
            ]}
          />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {currentCategory ? (
                <>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
                    <span>{t("products.categoryCollection", "Category Collection")}</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                    {t("products.productsIn", "Products in")}{" "}
                    <span className="text-indigo-600">{currentCategory.name}</span>
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
                    {currentCategory.description ||
                      `Discover all high-quality products and verified items in ${currentCategory.name}.`}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                    {activeSearchParam ? (
                      <>
                        Search results for{" "}
                        <span className="text-indigo-600">&ldquo;{activeSearchParam}&rdquo;</span>
                      </>
                    ) : (
                      t("products.allProducts", "Products Catalog")
                    )}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
                    Explore our universal catalog across electronics, fashion, home décor, jewellery, books, and lifestyle items.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="mt-8 flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                !activeCategoryParam && !visualMatches
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              {t("categories.allDepartments", "All Categories")}
            </button>
            {rootCategories.map((cat) => {
              const isSelected =
                !visualMatches && (activeCategoryParam === cat.id || activeCategoryParam === cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Visual Search Active Banner */}
        {visualMatches && (
          <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl shadow-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              {queryImageUrl && (
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 border border-white/20 shadow-md">
                  <img
                    src={queryImageUrl}
                    alt="Visual Search Target"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-indigo-200 text-[10px] font-black uppercase tracking-wider mb-1">
                  <span>✨ {t("visualSearch.visualSearchResults", "Visual Search Results")}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {t("visualSearch.showingVisualMatches", {
                    count: visualMatches.length,
                    defaultValue: `Showing ${visualMatches.length} items visually matching your photo`,
                  })}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsVisualModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
              >
                {t("visualSearch.changeImage", "Change Image")}
              </button>
              <button
                type="button"
                onClick={clearVisualSearch}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-xs transition-all cursor-pointer"
              >
                {t("visualSearch.clearVisualSearch", "View Full Catalog")}
              </button>
            </div>
          </div>
        )}

        {/* Typo Correction Banner if 0 results found with typo */}
        {didYouMean && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <span className="text-lg">💡</span>
              <span>
                No results found for &ldquo;{activeSearchParam}&rdquo;. Showing results for{" "}
                <button
                  type="button"
                  onClick={() => handleSearch(didYouMean)}
                  className="font-bold underline text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {didYouMean}
                </button>
                ?
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSearch(didYouMean)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Search &ldquo;{didYouMean}&rdquo;
            </button>
          </div>
        )}

        {/* Controls Bar: Mobile Filter Button, Results Count, Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile Filter Button */}
            {!visualMatches && (
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}

            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {visualMatches
                ? t("products.productsFound", {
                    count: visualMatches.length,
                    defaultValue: `${visualMatches.length} Visual Matches`,
                  })
                : pagination
                ? t("products.productsFound", {
                    count: pagination.total,
                    defaultValue: `${pagination.total} Products Found`,
                  })
                : t("products.catalog", "Catalog")}
            </span>

            {/* Active search chip */}
            {activeSearchParam && !visualMatches && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                <span>🔍 &ldquo;{activeSearchParam}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => handleSearch("")}
                  className="hover:text-rose-600 p-0.5 rounded-full font-black cursor-pointer ml-1"
                  title="Remove search"
                  aria-label="Remove search"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {!visualMatches && (
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                {t("products.sortBy", "Sort By:")}
              </span>
              <Select
                size="sm"
                variant="outline"
                value={
                  activeSortBy === "price"
                    ? activeSortOrder === "asc"
                      ? "price_asc"
                      : "price_desc"
                    : activeSortBy === "rating"
                    ? "rating_desc"
                    : activeSortBy === "discount"
                    ? "discount_desc"
                    : activeSortBy === "name"
                    ? activeSortOrder === "asc"
                      ? "name_asc"
                      : "name_desc"
                    : "newest"
                }
                onChange={handleSortChange}
                aria-label="Sort products by"
              >
                <option value="newest">{t("products.sortNewest", "Newest First")}</option>
                <option value="price_asc">{t("products.sortPriceLow", "Price: Low to High")}</option>
                <option value="price_desc">{t("products.sortPriceHigh", "Price: High to Low")}</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="discount_desc">Biggest Discount</option>
                <option value="name_asc">{t("products.sortNameAsc", "Name: A to Z")}</option>
                <option value="name_desc">Name: Z to A</option>
              </Select>
            </div>
          )}
        </div>

        {/* Main Grid with Filter Sidebar */}
        <div className="flex items-start gap-8">
          {/* Universal Product Filter Sidebar */}
          {!visualMatches && (
            <ProductFilterSidebar
              facets={facets}
              selectedSearch={activeSearchParam}
              onClearSearch={() => handleSearch("")}
              selectedCategory={activeCategoryParam}
              onSelectCategory={handleCategorySelect}
              selectedBrand={activeBrandParam}
              onSelectBrand={handleBrandSelect}
              minPrice={activeMinPrice}
              maxPrice={activeMaxPrice}
              onPriceChange={handlePriceChange}
              minRating={activeMinRating}
              onSelectRating={handleRatingSelect}
              minDiscount={activeMinDiscount}
              onSelectDiscount={handleDiscountSelect}
              inStockOnly={activeInStockOnly}
              onToggleInStock={handleToggleInStock}
              selectedAttributes={activeAttributes}
              onSelectAttribute={handleAttributeSelect}
              onClearAll={clearAllFilters}
              isOpenMobile={isMobileFilterOpen}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
            />
          )}

          {/* Product Cards Grid Area */}
          <div className="flex-1 min-w-0">
            {loading && !visualMatches ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
                <p className="text-xs font-medium text-slate-500">
                  {t("common.loading", "Loading catalog items...")}
                </p>
              </div>
            ) : visualMatches ? (
              /* Visual Search Results Grid */
              visualMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visualMatches.map((match) => (
                    <ProductCard
                      key={match.product.id}
                      product={match.product}
                      similarityScore={match.similarity}
                      isHighlyInterested={Boolean(highlyInterestedMap[match.product.id])}
                      visitCount={highlyInterestedMap[match.product.id]}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-12 text-center">
                  <EmptyState
                    icon="🔍"
                    title={t("visualSearch.noMatchesTitle", "No visual matches found")}
                    description={t(
                      "visualSearch.noMatchesDesc",
                      "No items closely matched your image. Try uploading a different photo."
                    )}
                    action={
                      <Button variant="primary" size="md" onClick={() => setIsVisualModalOpen(true)}>
                        {t("visualSearch.tryAnother", "Upload Another Image")}
                      </Button>
                    }
                  />
                </div>
              )
            ) : products.length > 0 ? (
              /* Standard Filtered Catalog Grid */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isHighlyInterested={Boolean(highlyInterestedMap[product.id])}
                      visitCount={highlyInterestedMap[product.id]}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => updateUrlParams({ page: p }, false)}
                    hasPrevPage={pagination.hasPrevPage}
                    hasNextPage={pagination.hasNextPage}
                    isLoading={loading}
                    className="mt-12"
                  />
                )}
              </>
            ) : (
              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-12 text-center">
                <EmptyState
                  icon="📦"
                  title={t("products.noProductsFound", "No products found")}
                  description={t(
                    "products.noProductsDesc",
                    "No matching items found for your filter criteria. Try clearing search or choosing another category."
                  )}
                  action={
                    <Button variant="primary" size="md" onClick={clearAllFilters}>
                      {t("products.clearAllFilters", "Clear All Filters")}
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Search Modal */}
      <SearchByImageModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
      />
    </div>
  );
};

export default ProductsPage;
