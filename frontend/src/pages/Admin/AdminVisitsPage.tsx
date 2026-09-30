import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchAdminVisits,
  fetchAdminRankedProducts,
} from "../../redux/visits/visitSlice";
import {
  AdminProductVisitItem,
  AdminVisitsFilterParams,
  AdminRankedFilterParams,
} from "../../types/visit";
import { useDebounce } from "../../hooks/useDebounce";
import {
  StatsCard,
  Button,
  SearchInput,
  Badge,
  EmptyState,
  Modal,
  Pagination,
  Icon,
} from "../../components/common";
import { getImageUrl } from "../../utils/image.utils";
import { formatDate, formatTimeAgo } from "../../utils/date";

export const AdminVisitsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Redux Store State
  const {
    adminVisits,
    adminPagination,
    adminStats,
    rankedProducts,
    loading: visitsLoading,
    rankedLoading,
  } = useAppSelector((state) => state.visits);

  // Active Tab View: "logs" (User Visits Log) or "ranked" (Ranked Products Report)
  const [activeTab, setActiveTab] = useState<"logs" | "ranked">("logs");

  // Tab 1: User Visits Filter State
  const [searchVisitTerm, setSearchVisitTerm] = useState<string>("");
  const debouncedVisitSearch = useDebounce(searchVisitTerm, 300);
  const [interestFilter, setInterestFilter] = useState<"all" | "true" | "false">("all");
  const [sortField, setSortField] = useState<
    "latestVisit" | "firstVisit" | "visitCount" | "userName" | "productName"
  >("latestVisit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Tab 2: Ranked Products Filter State
  const [rankedSearchTerm, setRankedSearchTerm] = useState<string>("");
  const debouncedRankedSearch = useDebounce(rankedSearchTerm, 300);
  const [rankedSortField, setRankedSortField] = useState<
    "totalVisits" | "uniqueVisitors" | "latestVisit" | "price"
  >("totalVisits");
  const [rankedSortOrder, setRankedSortOrder] = useState<"asc" | "desc">("desc");

  // Selected visit item for timestamp inspector audit modal
  const [selectedVisit, setSelectedVisit] = useState<AdminProductVisitItem | null>(null);

  // 1. Dispatch User Visits Log
  const loadVisitsLog = () => {
    const params: AdminVisitsFilterParams = {
      page: currentPage,
      limit: pageSize,
      search: debouncedVisitSearch.trim() || undefined,
      isHighlyInterested: interestFilter,
      sortBy: sortField,
      sortOrder: sortOrder,
    };
    dispatch(fetchAdminVisits(params));
  };

  // 2. Dispatch Ranked Products Report
  const loadRankedProducts = () => {
    const params: AdminRankedFilterParams = {
      limit: 100,
      search: debouncedRankedSearch.trim() || undefined,
      sortBy: rankedSortField as any,
      sortOrder: rankedSortOrder,
    };
    dispatch(fetchAdminRankedProducts(params));
  };

  // Trigger Log fetch on param changes via Redux
  useEffect(() => {
    if (activeTab === "logs") {
      loadVisitsLog();
    }
  }, [dispatch, activeTab, currentPage, debouncedVisitSearch, interestFilter, sortField, sortOrder]);

  // Trigger Ranked fetch on param changes via Redux
  useEffect(() => {
    if (activeTab === "ranked") {
      loadRankedProducts();
    }
  }, [dispatch, activeTab, debouncedRankedSearch, rankedSortField, rankedSortOrder]);

  // Fallback summary stats
  const stats = adminStats || {
    totalVisitsCount: 0,
    totalUniqueUserProductPairs: 0,
    totalHighlyInterestedPairs: 0,
    conversionRatePercent: 0,
    totalUniqueShoppers: 0,
    totalProductsTracked: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("admin.productVisitsLeads", {
              defaultValue: "Product Visits & Lead Analytics",
            })}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("admin.visitsDescription", {
              defaultValue:
                "Track genuine product views, customer browsing trends, and automated product interest analytics.",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              activeTab === "logs" ? loadVisitsLog() : loadRankedProducts()
            }
            variant="outline"
            size="md"
            loading={visitsLoading || rankedLoading}
            icon={<span>↻</span>}
          >
            {t("admin.refresh", { defaultValue: "Refresh" })}
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title={t("admin.totalImpressions", {
            defaultValue: "Total Impressions",
          })}
          value={stats.totalVisitsCount}
          subtitle={t("admin.genuineProductViews", { defaultValue: "Genuine Product Views" })}
          icon={<Icon name="eye" className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50 border border-blue-100"
          loading={visitsLoading && !adminStats}
        />
        <StatsCard
          title={t("admin.trackedShoppers", {
            defaultValue: "Engaged Shoppers",
          })}
          value={stats.totalUniqueShoppers}
          subtitle={t("admin.registeredUsersTracked", { defaultValue: "Registered Users Tracked" })}
          icon={<Icon name="users" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          loading={visitsLoading && !adminStats}
        />
        <StatsCard
          title={t("admin.productsOnRadar", {
            defaultValue: "Products on Radar",
          })}
          value={stats.totalProductsTracked}
          subtitle={t("admin.catalogItemsExplored", { defaultValue: "Catalog Items Explored" })}
          icon={<Icon name="package" className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50 border border-purple-100"
          loading={visitsLoading && !adminStats}
        />
      </div>

      {/* Control Bar: Tab Switcher, Search & Filters */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* View Tab Switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start">
            <button
              type="button"
              onClick={() => {
                setActiveTab("logs");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "logs"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Icon name="users" className="w-3.5 h-3.5" />
              <span>
                {t("admin.visitsLogsTab", {
                  defaultValue: "User Visits Log",
                })}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("ranked");
              }}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "ranked"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Icon name="award" className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {t("admin.rankedReportTab", {
                  defaultValue: "Products Ranked by Visits",
                })}
              </span>
            </button>
          </div>

          {/* Search & Sort Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl justify-end">
            <div className="flex-1">
              <SearchInput
                value={activeTab === "logs" ? searchVisitTerm : rankedSearchTerm}
                onChange={(val) => {
                  if (activeTab === "logs") {
                    setSearchVisitTerm(val);
                    setCurrentPage(1);
                  } else {
                    setRankedSearchTerm(val);
                  }
                }}
                placeholder={
                  activeTab === "logs"
                    ? t("admin.searchVisitsPlaceholder", {
                      defaultValue: "Search user, email, product, SKU...",
                    })
                    : t("admin.searchRankedPlaceholder", {
                      defaultValue:
                        "Search ranked products by title or SKU...",
                    })
                }
              />
            </div>

            {/* Sort Dropdown */}
            {activeTab === "logs" ? (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Sort:
                </span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none outline-hidden cursor-pointer"
                >
                  <option value="latestVisit">Latest Visit</option>
                  <option value="firstVisit">First Visit</option>
                  <option value="visitCount">Visit Count</option>
                  <option value="userName">User Name</option>
                  <option value="productName">Product Name</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="p-1 text-slate-500 hover:text-indigo-600 font-mono text-xs font-bold"
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? "▲" : "▼"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Rank:
                </span>
                <select
                  value={rankedSortField}
                  onChange={(e) => setRankedSortField(e.target.value as any)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none outline-hidden cursor-pointer"
                >
                  <option value="totalVisits">Total Visits</option>
                  <option value="uniqueVisitors">Unique Shoppers</option>
                  <option value="latestVisit">Latest Activity</option>
                  <option value="price">Price</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setRankedSortOrder(rankedSortOrder === "asc" ? "desc" : "asc")
                  }
                  className="p-1 text-slate-500 hover:text-indigo-600 font-mono text-xs font-bold"
                  title={rankedSortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {rankedSortOrder === "asc" ? "▲" : "▼"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills (for Tab 1) */}
        {activeTab === "logs" && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">
              {t("common.filter", { defaultValue: "Filter Status:" })}
            </span>
            <button
              type="button"
              onClick={() => {
                setInterestFilter("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${interestFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.all", { defaultValue: "All Visits" })} (
              {stats.totalUniqueUserProductPairs})
            </button>
            <button
              type="button"
              onClick={() => {
                setInterestFilter("true");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${interestFilter === "true"
                ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80"
                }`}
            >
              <Icon name="fire" className="w-3 h-3" />
              <span>
                {t("admin.highlyInterested", {
                  defaultValue: "Highly Interested",
                })}{" "}
                ({stats.totalHighlyInterestedPairs})
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInterestFilter("false");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${interestFilter === "false"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("admin.casualVisits", { defaultValue: "Casual" })} (
              {stats.totalUniqueUserProductPairs -
                stats.totalHighlyInterestedPairs}
              )
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER VISITS LOG TABLE */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[840px]">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">
                    {t("admin.shopper", { defaultValue: "Customer / Shopper" })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6">
                    {t("admin.product", { defaultValue: "Product Viewed" })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">
                    {t("admin.visitsCount", { defaultValue: "Visits" })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">
                    {t("admin.interestStatus", {
                      defaultValue: "Interest Status",
                    })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6">
                    {t("admin.timeline", { defaultValue: "Timeline" })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">
                    {t("common.actions", { defaultValue: "Actions" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visitsLoading && !adminVisits.length ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-500">
                          {t("common.loading", {
                            defaultValue: "Loading data...",
                          })}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : !adminVisits.length ? (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <EmptyState
                        title={t("admin.noVisitsFound", {
                          defaultValue: "No Product Visits Found",
                        })}
                        description={
                          searchVisitTerm
                            ? `No records matching "${searchVisitTerm}". Try changing filters.`
                            : "No authenticated user product visits recorded yet."
                        }
                        icon={<Icon name="eye" className="w-8 h-8 text-slate-400" />}
                      />
                    </td>
                  </tr>
                ) : (
                  adminVisits.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors group ${item.isHighlyInterested ? "bg-amber-50/15" : ""
                        }`}
                    >
                      {/* Customer / Shopper */}
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                            {item.user?.name
                              ? item.user.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{item.user?.name || "Unknown User"}</span>
                              {item.user?.role === "SUPER_ADMIN" && (
                                <Badge variant="primary" size="sm">
                                  SUPER_ADMIN
                                </Badge>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {item.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Product Viewed */}
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 max-w-xs">
                        <div className="flex items-center space-x-3">
                          {item.product?.thumbnail || item.product?.images?.[0] ? (
                            <img
                              src={getImageUrl(
                                item.product?.thumbnail ||
                                item.product?.images?.[0]
                              )}
                              alt={item.product?.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shadow-2xs flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/products/${item.product?.slug}`}
                              target="_blank"
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block group-hover:underline text-xs"
                            >
                              {item.product?.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.product?.category?.name && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  {item.product.category.name}
                                </span>
                              )}
                              <span className="text-xs font-black text-slate-900 font-mono">
                                ₹{Number(item.product?.price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Visit Count */}
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black font-mono shadow-2xs ${item.visitCount >= 3
                            ? "bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-400/40"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                        >
                          {item.visitCount}{" "}
                          {item.visitCount === 1 ? "view" : "views"}
                        </span>
                      </td>

                      {/* Interest Status */}
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center">
                        {item.isHighlyInterested ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-[11px] shadow-2xs uppercase tracking-wider">
                            <Icon name="fire" className="w-3 h-3 text-amber-200" />
                            <span>Highly Interested</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80">
                            Browsing ({item.visitCount}/3)
                          </span>
                        )}
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <Icon name="clock" className="w-3 h-3 text-indigo-500" />
                            <span>{formatTimeAgo(item.lastVisitedAt)}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {formatDate(item.firstVisitedAt)}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVisit(item)}
                          icon={<Icon name="activity" className="w-3.5 h-3.5" />}
                        >
                          {t("admin.auditTrail", { defaultValue: "Audit" })}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {adminPagination && adminPagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Pagination
                page={adminPagination.page}
                totalPages={adminPagination.totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                totalItems={adminPagination.total}
                currentItemsCount={adminVisits.length}
                itemLabel="records"
                align="between"
                infoFormat="page-of-total"
                size="md"
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCTS RANKED BY TOTAL VISITS REPORT */}
      {/* ========================================================================= */}
      {activeTab === "ranked" && (
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6 text-center w-16">
                    {t("admin.rank", { defaultValue: "Rank" })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6">
                    {t("admin.product", { defaultValue: "Product Details" })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">
                    {t("admin.totalVisits", { defaultValue: "Total Visits" })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">
                    {t("admin.uniqueShoppers", {
                      defaultValue: "Unique Shoppers",
                    })}
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">
                    {t("admin.latestActivity", {
                      defaultValue: "Latest Activity",
                    })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rankedLoading && !rankedProducts.length ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-500">
                          {t("common.loading", {
                            defaultValue: "Calculating rankings...",
                          })}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : !rankedProducts.length ? (
                  <tr>
                    <td colSpan={5} className="py-16">
                      <EmptyState
                        title={t("admin.noRankings", {
                          defaultValue: "No Ranked Products",
                        })}
                        description={
                          rankedSearchTerm
                            ? `No product rankings matching "${rankedSearchTerm}".`
                            : "Visit tracking will automatically rank products as customers browse."
                        }
                        icon={<Icon name="award" className="w-8 h-8 text-slate-400" />}
                      />
                    </td>
                  </tr>
                ) : (
                  rankedProducts.map((prod, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <tr
                        key={prod.productId}
                        className={`hover:bg-slate-50/60 transition-colors ${isTop1 ? "bg-amber-50/20 font-semibold" : ""
                          }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center">
                          {isTop1 ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs mx-auto">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="w-7 h-7 rounded-lg bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs mx-auto">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-700/80 text-white font-black text-xs flex items-center justify-center shadow-xs mx-auto">
                              3
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold font-mono text-xs flex items-center justify-center mx-auto">
                              #{index + 1}
                            </span>
                          )}
                        </td>

                        {/* Product Info */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                          <div className="flex items-center space-x-3">
                            {prod.thumbnail ? (
                              <img
                                src={getImageUrl(prod.thumbnail)}
                                alt={prod.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shadow-2xs flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
                                📦
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                to={`/products/${prod.slug}`}
                                target="_blank"
                                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block text-xs hover:underline"
                              >
                                {prod.name}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                {prod.category?.name && (
                                  <Badge variant="primary" size="sm">
                                    {prod.category.name}
                                  </Badge>
                                )}
                                <span className="text-xs font-black text-slate-900 font-mono">
                                  ₹{Number(prod.price || 0).toFixed(2)}
                                </span>
                                {prod.sku && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    SKU: {prod.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Impressions */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-black font-mono text-xs shadow-2xs">
                            {prod.totalVisitsCount.toLocaleString()}
                          </span>
                        </td>

                        {/* Unique Shoppers */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center font-mono font-bold text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <Icon name="users" className="w-3.5 h-3.5 text-slate-400" />
                            {prod.uniqueVisitorsCount}
                          </span>
                        </td>

                        {/* Latest Activity */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-right font-mono text-xs text-slate-600">
                          {prod.latestVisitAt ? (
                            <div>
                              <p className="font-bold text-slate-800">
                                {formatTimeAgo(prod.latestVisitAt)}
                              </p>
                              <p className="text-[10px] text-slate-400">{formatDate(prod.latestVisitAt)}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">Never</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIMESTAMPS AUDIT TRAIL MODAL */}
      {/* ========================================================================= */}
      {selectedVisit && (
        <Modal
          isOpen={Boolean(selectedVisit)}
          onClose={() => setSelectedVisit(null)}
          title={t("admin.visitAuditTitle", {
            defaultValue: "Product Visit Audit Trail",
          })}
          subtitle={`Verified historical timestamp logs for ${selectedVisit.user?.name}`}
          size="lg"
          icon={<Icon name="activity" className="w-5 h-5 text-indigo-600" />}
        >
          <div className="p-6 space-y-6">
            {/* User & Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Customer Profile
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    {selectedVisit.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">
                      {selectedVisit.user?.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {selectedVisit.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Target Product
                </p>
                <div className="flex items-center space-x-3">
                  {selectedVisit.product?.thumbnail ||
                    selectedVisit.product?.images?.[0] ? (
                    <img
                      src={getImageUrl(
                        selectedVisit.product?.thumbnail ||
                        selectedVisit.product?.images?.[0]
                      )}
                      alt={selectedVisit.product?.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs flex-shrink-0">
                      📦
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">
                      {selectedVisit.product?.name}
                    </p>
                    <p className="text-[11px] font-mono font-bold text-indigo-600">
                      ₹{Number(selectedVisit.product?.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest Status Alert */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${selectedVisit.isHighlyInterested
                ? "bg-amber-50/60 border-amber-200"
                : "bg-slate-50 border-slate-200"
                }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {selectedVisit.isHighlyInterested ? "🔥" : "👀"}
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">
                    {selectedVisit.isHighlyInterested
                      ? "High-Interest Intent Confirmed"
                      : "Browsing Shopper"}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {selectedVisit.isHighlyInterested
                      ? "Customer has surpassed the 3-visit threshold. This product is prioritized on their radar."
                      : `Customer has viewed this item ${selectedVisit.visitCount} times (${Math.max(0, 3 - selectedVisit.visitCount)} more needed for High-Interest status).`}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black ${selectedVisit.isHighlyInterested
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "bg-slate-200 text-slate-700"
                  }`}
              >
                {selectedVisit.visitCount} Visits
              </span>
            </div>

            {/* Genuine Timestamp Logs List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Recorded Genuine Visit Timestamps
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">
                  15-min Anti-spam Protected
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedVisit.visitTimestamps &&
                  selectedVisit.visitTimestamps.length > 0 ? (
                  selectedVisit.visitTimestamps.map((ts, index) => {
                    const isFirst = index === 0;
                    const isLatest =
                      index === selectedVisit.visitTimestamps.length - 1;
                    const isThresholdPoint = index === 2;

                    return (
                      <div
                        key={index}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${isThresholdPoint
                          ? "bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/40"
                          : "bg-white border-slate-200"
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold font-mono text-[10px] flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 font-mono text-[11px]">
                              {formatDate(ts)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {formatTimeAgo(ts)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isThresholdPoint && (
                            <Badge variant="warning" size="sm">
                              🔥 High-Interest Trigger
                            </Badge>
                          )}
                          {isFirst && (
                            <Badge variant="info" size="sm">
                              Initial View
                            </Badge>
                          )}
                          {isLatest && !isFirst && (
                            <Badge variant="success" size="sm">
                              Latest
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                    Latest visit recorded at{" "}
                    {formatDate(selectedVisit.lastVisitedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                to={`/products/${selectedVisit.product?.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                <span>
                  {t("common.openInStore", { defaultValue: "Open Product" })}
                </span>
                <Icon name="external-link" className="w-3.5 h-3.5" />
              </Link>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedVisit(null)}
              >
                {t("common.done", { defaultValue: "Done" })}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminVisitsPage;
