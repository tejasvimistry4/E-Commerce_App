import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon } from "../../assets";
import { useOrder } from "../../hooks/useOrder";
import { useDebounce } from "../../hooks/useDebounce";
import { SearchInput, Pagination } from "../../components/common";
import { ROUTES } from "../../config/routes";
import { OrderStatus } from "../../types/order";
import { formatPrice, formatDate, getImageUrl } from "../../utils";
import { VariantBadge } from "../../components/products/VariantBadge";

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { orders, pagination, fetchMyOrders, downloadOrderPdf, loading } = useOrder();

  const statusTabs = useMemo(() => [
    { label: t("orders.allOrders", { defaultValue: "All Orders" }), value: "ALL" },
    { label: t("orders.placed", { defaultValue: "Placed" }), value: "PENDING" },
    { label: t("orders.inPacking", { defaultValue: "In Packing" }), value: "PROCESSING" },
    { label: t("orders.inTransit", { defaultValue: "In Transit" }), value: "SHIPPED" },
    { label: t("orders.delivered", { defaultValue: "Delivered" }), value: "DELIVERED" },
    { label: t("orders.cancelled", { defaultValue: "Cancelled" }), value: "CANCELLED" },
  ], [t]);

  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const handleQuickDownloadInvoice = async (e: React.MouseEvent, order: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDownloadingOrderId(order.id);
      await downloadOrderPdf(order.id, "invoice", {
        customFilename: `TaxInvoice-${order.orderNumber}.pdf`,
      });
      toast.success("Invoice downloaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to download invoice.");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  useEffect(() => {
    const refreshData = () => {
      fetchMyOrders({
        page: currentPage,
        limit: 10,
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        search: debouncedSearchTerm.trim() || undefined,
      });
    };

    refreshData();

    const interval = setInterval(refreshData, 10000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refreshData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [selectedStatus, debouncedSearchTerm, currentPage, fetchMyOrders]);

  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    toast.success(`${t("common.copied", { defaultValue: "Copied" })} #${orderNumber}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getReturnBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            <Icon name="refresh" size={13} /> {t("orders.requestReturn", { defaultValue: "Return Requested" })}
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            <Icon name="check" size={13} /> Return Approved
          </span>
        );
      case "PICKED_UP":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Icon name="truck" size={13} /> Item Picked Up
          </span>
        );
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Icon name="package" size={13} /> Return Received
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <Icon name="check-circle" size={13} /> Refund Completed
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <Icon name="x-circle" size={13} /> Return Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <Icon name="clock" size={13} /> {t("orders.placed", { defaultValue: "Order Placed" })}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <Icon name="package" size={13} /> {t("orders.inPacking", { defaultValue: "In Packing" })}
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <Icon name="truck" size={13} /> {t("orders.inTransit", { defaultValue: "In Transit" })}
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <Icon name="check-circle" size={13} className="text-emerald-600" /> {t("orders.delivered", { defaultValue: "Delivered" })}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <Icon name="x-circle" size={13} /> {t("orders.cancelled", { defaultValue: "Cancelled" })}
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: string, method: string) => {
    if (method === "CASH_ON_DELIVERY") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          COD
        </span>
      );
    }
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Icon name="check" size={11} /> Paid
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Icon name="x-circle" size={11} /> Payment Failed
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Payment Pending
          </span>
        );
    }
  };


  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                {t("customer.dashboard", { defaultValue: "Customer Account" })}
              </span>
              <span className="text-xs text-slate-400 font-medium">Order History & Shipment Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t("orders.title", { defaultValue: "My Orders" })}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t("orders.subtitle", { defaultValue: "Review your purchase history, check real-time dispatch milestones, and view order receipts." })}
            </p>
          </div>

          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99] self-start sm:self-auto"
          >
            <Icon name="shopping-bag" size={14} /> {t("products.catalog", { defaultValue: "Browse Catalog" })}
          </Link>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setSelectedStatus(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder={t("common.search", { defaultValue: "Search by Order #..." })}
              size="sm"
            />
          </div>
        </div>

        {/* Orders List Container */}
        {loading && orders.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-800">{t("common.loading", { defaultValue: "Loading your orders..." })}</h3>
            <p className="text-xs text-slate-400 mt-1">Retrieving order milestones and shipment tracking</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center shadow-sm border border-slate-200/80">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
              <Icon name="package" size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {t("orders.noOrdersFound", { defaultValue: "No Orders Found" })}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
              {searchTerm || selectedStatus !== "ALL"
                ? t("products.noProductsDesc", { defaultValue: "No orders match your chosen filters. Try clearing your search keyword or switching status filters." })
                : t("orders.noOrdersDesc", { defaultValue: "You haven't placed any orders yet. Discover our premium collection and start shopping today!" })}
            </p>
            <Link
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
            >
              {t("home.startBrowsing", { defaultValue: "Start Shopping" })} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => {
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden"
                >
                  {/* Top Bar Header */}
                  <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                      {/* Order Placed Date */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                          {t("orders.orderPlaced", { defaultValue: "ORDER PLACED" })}
                        </span>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                          <Icon name="calendar" size={13} className="text-slate-400" />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      {/* Total Amount */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                          {t("orders.totalAmount", { defaultValue: "TOTAL AMOUNT" })}
                        </span>
                        <span className="font-black text-indigo-600 text-sm mt-0.5 block">
                          {formatPrice(order.grandTotal)}
                        </span>
                      </div>

                      {/* Delivery Recipient */}
                      <div className="hidden sm:block">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                          {t("orders.shipTo", { defaultValue: "SHIP TO" })}
                        </span>
                        <span className="text-slate-700 font-bold truncate max-w-[160px] block mt-0.5">
                          {order.shippingAddress.fullName}
                        </span>
                      </div>
                    </div>

                    {/* Status & Copy Order Number */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                      {order.returnRequest && getReturnBadge(order.returnRequest.status)}

                      <button
                        type="button"
                        onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                        className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                        title={t("common.copy", { defaultValue: "Click to copy order number" })}
                      >
                        <span className="text-xs">#{order.orderNumber}</span>
                        {copiedId === order.orderNumber ? (
                          <Icon name="check" size={12} className="text-emerald-600" />
                        ) : (
                          <Icon name="copy" size={12} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Body - Itemized Product List */}
                  <div className="p-4 sm:p-6">
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Product Thumbnail */}
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
                              {item.image ? (
                                <img
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Icon name="package" size={20} className="text-slate-400" />
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {item.name}
                              </h4>
                              {(item.variantAttributes || item.variant?.attributes) && (
                                <div className="mt-1">
                                  <VariantBadge
                                    attributes={(item.variantAttributes || item.variant?.attributes) as Record<string, string>}
                                    sku={item.variant?.sku}
                                    compact
                                  />
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                                  Qty: {item.quantity}
                                </span>
                                <span>•</span>
                                <span>Unit: {formatPrice(item.price)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Item Total Price */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs sm:text-sm font-black text-slate-900 block">
                              {formatPrice(item.totalPrice)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Location & Action Bar */}
                  <div className="px-4 sm:px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {/* Destination & Payment Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Icon name="map-pin" size={13} className="text-indigo-600 flex-shrink-0" />
                        <span>
                          {order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.postalCode})
                        </span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Icon name="credit-card" size={13} className="text-slate-400 flex-shrink-0" />
                        <span>{order.paymentMethod.replace(/_/g, " ")}</span>
                      </span>
                    </div>

                    {/* Action Link & Quick Download */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleQuickDownloadInvoice(e, order)}
                        disabled={downloadingOrderId === order.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                        title="Download Tax Invoice (PDF)"
                      >
                        {downloadingOrderId === order.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon name="download" size={13} className="text-slate-500" />
                        )}
                        <span>{t("orders.invoice", { defaultValue: "Invoice" })}</span>
                      </button>

                      <Link
                        to={ROUTES.ORDER_DETAIL(order.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
                      >
                        <span>{t("orders.trackOrderDetails", { defaultValue: "Track Order & Details" })}</span>
                        <Icon name="arrow-right" size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                hasPrevPage={pagination.hasPrevPage}
                hasNextPage={pagination.hasNextPage}
                isLoading={loading}
                className="pt-6"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
