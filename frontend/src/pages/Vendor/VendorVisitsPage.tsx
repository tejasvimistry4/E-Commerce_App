import React, { useEffect, useState } from "react";
import {
  getAdminVisitsApi,
  getAdminRankedProductsApi,
} from "../../api/visit.api";
import {
  AdminProductVisitItem,
  AdminVisitsSummaryStats,
  AdminRankedProductItem,
} from "../../types/visit";
import { useDebounce } from "../../hooks/useDebounce";
import {
  SearchInput,
  StatsCard,
  Badge,
  Pagination,
  Button,
  EmptyState,
} from "../../components/common";
import { getImageUrl } from "../../utils/image.utils";
import { formatDate } from "../../utils";
import { toast } from "react-toastify";

export const VendorVisitsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"VISITS" | "RANKED">("VISITS");
  const [loading, setLoading] = useState(true);

  // Visits list state
  const [visits, setVisits] = useState<AdminProductVisitItem[]>([]);
  const [stats, setStats] = useState<AdminVisitsSummaryStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isHighlyInterestedFilter, setIsHighlyInterestedFilter] = useState<string>("all");

  // Ranked products state
  const [rankedProducts, setRankedProducts] = useState<AdminRankedProductItem[]>([]);
  const [rankedLoading, setRankedLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "VISITS") {
      fetchVisits();
    } else {
      fetchRanked();
    }
  }, [activeTab, page, debouncedSearch, isHighlyInterestedFilter]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await getAdminVisitsApi({
        page,
        limit: 15,
        search: debouncedSearch.trim() || undefined,
        isHighlyInterested:
          isHighlyInterestedFilter === "true"
            ? "true"
            : isHighlyInterestedFilter === "false"
              ? "false"
              : undefined,
      });

      if (res) {
        setVisits(res.items || []);
        setStats(res.stats || null);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      toast.error(String(err?.response?.data?.message || "Failed to load product visits"));
    } finally {
      setLoading(false);
    }
  };

  const fetchRanked = async () => {
    try {
      setRankedLoading(true);
      const res = await getAdminRankedProductsApi({
        limit: 50,
        sortBy: "totalVisits",
        sortOrder: "desc",
      });

      if (res) {
        setRankedProducts(res.items || []);
      }
    } catch (err: any) {
      toast.error(String(err?.response?.data?.message || "Failed to load ranked products report"));
    } finally {
      setRankedLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              Shopper Intent Analytics
            </span>
            <span className="text-xs text-slate-400">• High-Interest Leads</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Product Visits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track genuine shopper visits and discover high-intent leads who viewed your products 3+ times.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => (activeTab === "VISITS" ? fetchVisits() : fetchRanked())}
            variant="outline"
            size="md"
            loading={loading || rankedLoading}
            icon={<span>↻</span>}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Genuine Visits"
          value={stats?.totalVisitsCount ?? 0}
          subtitle="Non-Spam Store Product Views"
          icon={<span className="text-lg">👀</span>}
          iconBg="bg-indigo-50 border border-indigo-100"
          loading={loading}
        />
        <StatsCard
          title="High-Intent Leads"
          value={stats?.totalHighlyInterestedPairs ?? 0}
          subtitle="3+ Genuine Product Visits"
          icon={<span className="text-lg">🎯</span>}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700 font-black"
          badge={{ text: "Hot Leads", variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title="Unique Shoppers"
          value={stats?.totalUniqueShoppers ?? 0}
          subtitle="Distinct Customers Browsing"
          icon={<span className="text-lg">👥</span>}
          iconBg="bg-purple-50 border border-purple-100"
          valueClassName="text-purple-700"
          loading={loading}
        />
        <StatsCard
          title="High Interest Rate"
          value={`${stats?.conversionRatePercent ?? 0}%`}
          subtitle="Browsers Reaching High Intent"
          icon={<span className="text-lg">📈</span>}
          iconBg="bg-amber-50 border border-amber-100"
          valueClassName="text-amber-700 font-black"
          loading={loading}
        />
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("VISITS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "VISITS"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
        >
          Customer Visit Records
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("RANKED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "RANKED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
        >
          Top Visited Products Report
        </button>
      </div>

      {/* Tab 1: Visits Records */}
      {activeTab === "VISITS" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <SearchInput
                value={searchTerm}
                onChange={(val) => {
                  setSearchTerm(val);
                  setPage(1);
                }}
                placeholder="Search by shopper name, email, or product..."
              />
            </div>

            <div className="flex items-center space-x-1.5 pt-3 border-t border-slate-100 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  setIsHighlyInterestedFilter("all");
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isHighlyInterestedFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
              >
                All Visits
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHighlyInterestedFilter("true");
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isHighlyInterestedFilter === "true"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
              >
                ★ Highly Interested Leads Only ({stats?.totalHighlyInterestedPairs ?? 0})
              </button>
            </div>
          </div>

          {/* Visits Table */}
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Shopper</th>
                    <th className="py-3.5 px-4 sm:px-6">Product Visited</th>
                    <th className="py-3.5 px-4 sm:px-6">Visit Count</th>
                    <th className="py-3.5 px-4 sm:px-6">Lead Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Latest Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Shopper */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {visit.user?.name ? visit.user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {visit.user?.name || "Shopper"}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {visit.user?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            {visit.product?.thumbnail ? (
                              <img
                                src={getImageUrl(visit.product.thumbnail)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">
                              {visit.product?.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ₹{visit.product?.price}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Visit Count */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="text-sm font-black text-slate-900">
                          {visit.visitCount}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">views</span>
                      </td>

                      {/* Lead Status */}
                      <td className="py-4 px-4 sm:px-6">
                        {visit.isHighlyInterested ? (
                          <Badge variant="success" size="sm">
                            ★ HIGHLY INTERESTED
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            EXPLORING ({visit.visitCount}/3)
                          </Badge>
                        )}
                      </td>

                      {/* Latest Visit */}
                      <td className="py-4 px-4 sm:px-6 text-right text-xs text-slate-500">
                        {formatDate(visit.lastVisitedAt)}
                      </td>
                    </tr>
                  ))}

                  {visits.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-12">
                        <EmptyState
                          title="No product visits recorded"
                          description="Shopper visits to your products will appear here in real-time."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex justify-center">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Ranked Products Report */}
      {activeTab === "RANKED" && (
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[780px]">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Rank & Product</th>
                  <th className="py-3.5 px-4 sm:px-6">Total Visits</th>
                  <th className="py-3.5 px-4 sm:px-6">Unique Visitors</th>
                  <th className="py-3.5 px-4 sm:px-6">High Intent Shoppers</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Lead Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rankedProducts.map((item, idx) => (
                  <tr key={item.productId} className="hover:bg-slate-50/60 transition-colors">
                    {/* Rank & Product */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx === 0
                              ? "bg-amber-400 text-slate-900 shadow-xs"
                              : idx === 1
                                ? "bg-slate-300 text-slate-800"
                                : idx === 2
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {item.thumbnail ? (
                            <img
                              src={getImageUrl(item.thumbnail)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-500">₹{item.price}</span>
                        </div>
                      </div>
                    </td>

                    {/* Total Visits */}
                    <td className="py-4 px-4 sm:px-6 font-black text-slate-900 text-sm">
                      {item.totalVisitsCount}
                    </td>

                    {/* Unique Visitors */}
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800">
                      {item.uniqueVisitorsCount} shoppers
                    </td>

                    {/* High Intent Shoppers */}
                    <td className="py-4 px-4 sm:px-6">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {item.highlyInterestedUsersCount} leads
                      </span>
                    </td>

                    {/* Conversion % */}
                    <td className="py-4 px-4 sm:px-6 text-right font-black text-slate-900 text-sm">
                      {item.conversionRatePercent}%
                    </td>
                  </tr>
                ))}

                {rankedProducts.length === 0 && !rankedLoading && (
                  <tr>
                    <td colSpan={5} className="py-12">
                      <EmptyState
                        title="No ranked product data"
                        description="Product visits will aggregate here automatically."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorVisitsPage;
