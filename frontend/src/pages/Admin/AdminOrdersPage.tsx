import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Icon } from "../../assets";
import { useOrder } from "../../hooks/useOrder";
import { useDebounce } from "../../hooks/useDebounce";
import { SearchInput, Modal, Button, Pagination, Textarea, Select, StatsCard } from "../../components/common";
import { MESSAGES } from "../../constants/messages";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  ReturnRequest,
  ReturnStatus,
} from "../../types/order";
import { formatPrice, formatDate, getImageUrl } from "../../utils";
import { useTranslation } from "react-i18next";
import { VariantBadge } from "../../components/products/VariantBadge";

const ORDER_STATUS_LIST: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const RETURN_STATUS_LIST: ReturnStatus[] = [
  "REQUESTED",
  "APPROVED",
  "PICKED_UP",
  "RECEIVED",
  "REFUNDED",
  "REJECTED",
];

export const AdminOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    adminOrders,
    adminStats,
    adminPagination,
    adminReturns,
    adminReturnPagination,
    fetchAdminOrders,
    fetchAdminReturns,
    fetchAdminStats,
    updateAdminStatus,
    updateAdminReturnStatus,
    downloadOrderPdf,
    loading,
    actionLoading,
  } = useOrder();

  const [activeTab, setActiveTab] = useState<"ORDERS" | "RETURNS">("ORDERS");

  // Orders State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleAdminDownloadPdf = async (
    orderId: string,
    type: "order" | "invoice",
    orderNumber: string
  ) => {
    try {
      setDownloadingDocId(`${orderId}-${type}`);
      await downloadOrderPdf(orderId, type, {
        isAdmin: true,
        customFilename: `${type === "invoice" ? "AdminInvoice" : "AdminOrderSlip"}-${orderNumber}.pdf`,
      });
      toast.success(
        type === "invoice"
          ? "Tax Invoice downloaded successfully!"
          : "Order Slip PDF downloaded successfully!"
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to download PDF.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Returns State
  const [returnSearchTerm, setReturnSearchTerm] = useState("");
  const debouncedReturnSearchTerm = useDebounce(returnSearchTerm, 300);
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>("ALL");
  const [returnCurrentPage, setReturnCurrentPage] = useState(1);

  // Status edit modal state
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("PENDING");
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [statusNotes, setStatusNotes] = useState("");

  // Return status edit modal state
  const [selectedReturnForStatus, setSelectedReturnForStatus] = useState<ReturnRequest | null>(null);
  const [newReturnStatus, setNewReturnStatus] = useState<ReturnStatus>("APPROVED");
  const [adminReturnComment, setAdminReturnComment] = useState("");

  // Inspect detail modal state
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);
  const [inspectReturn, setInspectReturn] = useState<ReturnRequest | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    toast.success(t("orders.copiedId", { number: orderNumber, defaultValue: `Copied #${orderNumber}` }));
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const refreshData = () => {
      fetchAdminStats();
      if (activeTab === "ORDERS") {
        fetchAdminOrders({
          page: currentPage,
          limit: 10,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: debouncedSearchTerm.trim() || undefined,
        });
      } else {
        fetchAdminReturns({
          page: returnCurrentPage,
          limit: 10,
          status: returnStatusFilter === "ALL" ? undefined : returnStatusFilter,
          search: debouncedReturnSearchTerm.trim() || undefined,
        });
      }
    };

    refreshData();

    const interval = setInterval(refreshData, 5000);

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
  }, [
    activeTab,
    currentPage,
    statusFilter,
    debouncedSearchTerm,
    returnCurrentPage,
    returnStatusFilter,
    debouncedReturnSearchTerm,
    fetchAdminOrders,
    fetchAdminReturns,
    fetchAdminStats,
  ]);

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrderForStatus(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.paymentStatus);
    setStatusNotes(order.notes || "");
  };

  const handleOpenReturnStatusModal = (returnReq: ReturnRequest) => {
    setSelectedReturnForStatus(returnReq);
    // Suggest appropriate default next status
    switch (returnReq.status) {
      case "REQUESTED":
        setNewReturnStatus("APPROVED");
        break;
      case "APPROVED":
        setNewReturnStatus("PICKED_UP");
        break;
      case "PICKED_UP":
        setNewReturnStatus("RECEIVED");
        break;
      case "RECEIVED":
        setNewReturnStatus("REFUNDED");
        break;
      default:
        setNewReturnStatus(returnReq.status);
    }
    setAdminReturnComment(returnReq.adminComment || "");
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForStatus) return;

    try {
      await updateAdminStatus(
        selectedOrderForStatus.id,
        newStatus,
        newPaymentStatus,
        statusNotes.trim() || undefined
      );
      toast.success(t("messages.orders.statusUpdated", { status: newStatus, defaultValue: MESSAGES.ORDERS.STATUS_UPDATED(newStatus) }));
      setSelectedOrderForStatus(null);
      fetchAdminStats();
      fetchAdminOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
      });
    } catch (err: any) {
      toast.error(err || t("messages.common.genericError", { defaultValue: MESSAGES.ORDERS.STATUS_FAILED }));
    }
  };

  const handleSaveReturnStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnForStatus) return;

    try {
      await updateAdminReturnStatus(selectedReturnForStatus.id, {
        status: newReturnStatus,
        adminComment: adminReturnComment.trim() || undefined,
      });
      toast.success(`Return request transitioned to ${newReturnStatus}.`);
      setSelectedReturnForStatus(null);
      fetchAdminStats();
      fetchAdminReturns({
        page: returnCurrentPage,
        limit: 10,
        status: returnStatusFilter === "ALL" ? undefined : returnStatusFilter,
        search: returnSearchTerm.trim() || undefined,
      });
    } catch (err: any) {
      toast.error(err || "Failed to update return status.");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Icon name="clock" size={12} /> Pending
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Icon name="package" size={12} /> Processing
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Icon name="truck" size={12} /> Shipped
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Icon name="check-circle" size={12} /> Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Icon name="x-circle" size={12} /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getReturnStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case "REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            Requested
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Icon name="check" size={12} /> Approved
          </span>
        );
      case "PICKED_UP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Icon name="truck" size={12} /> Picked Up
          </span>
        );
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Icon name="package" size={12} /> Received
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Icon name="check-circle" size={12} /> Refunded
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Icon name="x-circle" size={12} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t("orders.managementTitle", { defaultValue: "Order & Returns Management" })}
          </h1>
        </div>

        {/* View Mode Tab Switcher */}
        <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "ORDERS"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <Icon name="package" size={14} /> {t("orders.allOrders", { defaultValue: "All Orders" })}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RETURNS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "RETURNS"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <Icon name="refresh" size={14} /> {t("orders.returnsAndRefunds", { defaultValue: "Returns & Refunds" })}
            {adminReturns.filter((r: any) => r.status === "REQUESTED").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {adminStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatsCard
            title={t("admin.totalRevenue", { defaultValue: "Revenue" })}
            value={formatPrice(adminStats.totalRevenue)}
            subtitle={t("orders.netProcessed", { defaultValue: "Net Processed" })}
            icon={<Icon name="dollar" size={16} />}
            iconBg="bg-indigo-50 text-indigo-600 border border-indigo-100"
          />
          <StatsCard
            title={t("admin.totalOrders", { defaultValue: "Total Orders" })}
            value={adminStats.totalOrders}
            subtitle={t("orders.allPlacedOrders", { defaultValue: "All Placed" })}
            icon={<Icon name="package" size={16} />}
            iconBg="bg-slate-100 text-slate-700 border border-slate-200"
          />
          <StatsCard
            title={t("orders.pending", { defaultValue: "Pending" })}
            value={adminStats.pendingOrders}
            subtitle={t("orders.awaitingPacking", { defaultValue: "Awaiting Packing" })}
            icon={<Icon name="clock" size={16} />}
            iconBg="bg-amber-50 text-amber-600 border border-amber-100"
            valueClassName="text-amber-700"
          />
          <StatsCard
            title={t("orders.inPacking", { defaultValue: "Processing" })}
            value={adminStats.processingOrders}
            subtitle={t("orders.inWarehouse", { defaultValue: "In Warehouse" })}
            icon={<Icon name="package" size={16} />}
            iconBg="bg-blue-50 text-blue-600 border border-blue-100"
            valueClassName="text-blue-700"
          />
          <StatsCard
            title={t("orders.inTransit", { defaultValue: "In Transit" })}
            value={adminStats.shippedOrders}
            subtitle={t("orders.dispatched", { defaultValue: "Dispatched" })}
            icon={<Icon name="truck" size={16} />}
            iconBg="bg-purple-50 text-purple-600 border border-purple-100"
            valueClassName="text-purple-700"
          />
          <StatsCard
            title={t("orders.delivered", { defaultValue: "Delivered" })}
            value={adminStats.deliveredOrders}
            subtitle={t("orders.eligibleReturns", { defaultValue: "Completed" })}
            icon={<Icon name="check-circle" size={16} />}
            iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100"
            valueClassName="text-emerald-700"
          />
        </div>
      )}

      {/* VIEW TAB 1: ALL ORDERS */}
      {activeTab === "ORDERS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="w-full sm:max-w-sm">
              <SearchInput
                value={searchTerm}
                onChange={(val) => {
                  setSearchTerm(val);
                  setCurrentPage(1);
                }}
                placeholder={t("orders.searchPlaceholder", { defaultValue: "Search by Order # or Customer Name..." })}
                size="sm"
              />
            </div>

            {/* Filter Dropdown */}
            <Select
              size="sm"
              leftIcon={<Icon name="filter" size={14} className="text-slate-400" />}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter orders by status"
            >
              <option value="ALL">{t("orders.allStatuses", { defaultValue: "All Order Statuses" })}</option>
              {ORDER_STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">{t("orders.orderNumber", { defaultValue: "Order ID" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("customer.dashboard", { defaultValue: "Customer" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("cart.title", { defaultValue: "Items" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("checkout.datePlaced", { defaultValue: "Date" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("products.activeStatus", { defaultValue: "Status" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("cart.total", { defaultValue: "Total" })}</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">{t("common.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading && adminOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      {t("common.loading", { defaultValue: "Loading orders..." })}
                    </td>
                  </tr>
                ) : adminOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {t("orders.noOrdersFound", { defaultValue: "No orders found matching criteria." })}
                    </td>
                  </tr>
                ) : (
                  adminOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100 text-[11px] inline-block">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {order.shippingAddress?.fullName || order.user?.name || "Customer"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {order.user?.email || order.shippingAddress?.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {order.items.reduce((acc: number, i: any) => acc + i.quantity, 0)} pcs
                          </span>
                          <span className="text-slate-400 text-[11px]">({order.items.length} items)</span>
                        </div>
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-slate-500 whitespace-nowrap text-[11px]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(order.status)}
                          {order.returnRequest && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Icon name="refresh" size={10} /> Ret: {order.returnRequest.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-black text-slate-900">
                        {formatPrice(order.grandTotal)}
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdminDownloadPdf(order.id, "invoice", order.orderNumber)}
                            disabled={downloadingDocId === `${order.id}-invoice`}
                            title="Download Tax Invoice (PDF)"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            {downloadingDocId === `${order.id}-invoice` ? (
                              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Icon name="download" size={13} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectOrder(order)}
                            title={t("orders.viewDetails", { defaultValue: "View Details" })}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Icon name="eye" size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(order)}
                            title={t("orders.updateStatus", { defaultValue: "Update Status" })}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {adminPagination && (
            <div className="p-4 sm:p-5 border-t border-slate-100">
              <Pagination
                page={adminPagination.page}
                totalPages={adminPagination.totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                hasPrevPage={adminPagination.hasPrevPage}
                hasNextPage={adminPagination.hasNextPage}
                totalItems={adminPagination.total}
                currentItemsCount={adminOrders.length}
                itemLabel="orders"
                align="between"
                infoFormat="fraction"
                size="sm"
              />
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 2: RETURNS MANAGEMENT */}
      {activeTab === "RETURNS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Return Search Box */}
            <div className="w-full sm:max-w-sm">
              <SearchInput
                value={returnSearchTerm}
                onChange={(val) => {
                  setReturnSearchTerm(val);
                  setReturnCurrentPage(1);
                }}
                placeholder={t("orders.searchReturnPlaceholder", { defaultValue: "Search by Order # or Return Reason..." })}
                size="sm"
              />
            </div>

            {/* Return Status Filter */}
            <Select
              size="sm"
              leftIcon={<Icon name="filter" size={14} className="text-slate-400" />}
              value={returnStatusFilter}
              onChange={(e) => {
                setReturnStatusFilter(e.target.value);
                setReturnCurrentPage(1);
              }}
              aria-label="Filter returns by status"
            >
              <option value="ALL">{t("orders.allReturnStatuses", { defaultValue: "All Return Statuses" })}</option>
              {RETURN_STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </div>

          {/* Returns Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">{t("orders.orderNumber", { defaultValue: "Order ID" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("customer.dashboard", { defaultValue: "Customer" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("orders.reasonAndDetails", { defaultValue: "Reason & Details" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("orders.requestedDate", { defaultValue: "Requested Date" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("orders.returnStatus", { defaultValue: "Return Status" })}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("orders.refundAmount", { defaultValue: "Refund Amount" })}</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">{t("common.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading && adminReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      {t("orders.loadingReturns", { defaultValue: "Loading return requests..." })}
                    </td>
                  </tr>
                ) : adminReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {t("orders.noReturnsFound", { defaultValue: "No return requests found." })}
                    </td>
                  </tr>
                ) : (
                  adminReturns.map((ret: any) => (
                    <tr key={ret.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <span className="font-mono font-bold text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-100 text-[11px] inline-block">
                          #{ret.order?.orderNumber || "ORD"}
                        </span>
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {ret.user?.name || ret.order?.shippingAddress?.fullName || "Customer"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ret.user?.email || ret.order?.shippingAddress?.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{ret.reason}</p>
                        {ret.details && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{ret.details}</p>
                        )}
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-slate-500 whitespace-nowrap text-[11px]">
                        {formatDate(ret.createdAt)}
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6">{getReturnStatusBadge(ret.status)}</td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-black text-purple-900">
                        {formatPrice(ret.refundAmount)}
                      </td>
                      <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectReturn(ret)}
                            title={t("orders.inspectReturnDetails", { defaultValue: "Inspect Return Details" })}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-slate-600 hover:text-purple-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Icon name="eye" size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReturnStatusModal(ret)}
                            title={t("orders.updateReturnStatus", { defaultValue: "Update Return Status / Process" })}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Returns Pagination */}
          {adminReturnPagination && (
            <div className="p-4 sm:p-5 border-t border-slate-100">
              <Pagination
                page={adminReturnPagination.page}
                totalPages={adminReturnPagination.totalPages}
                onPageChange={(p) => setReturnCurrentPage(p)}
                hasPrevPage={adminReturnPagination.hasPrevPage}
                hasNextPage={adminReturnPagination.hasNextPage}
                totalItems={adminReturnPagination.total}
                currentItemsCount={adminReturns.length}
                itemLabel="return requests"
                align="between"
                infoFormat="fraction"
                size="sm"
              />
            </div>
          )}
        </div>
      )}

      {/* UPDATE ORDER STATUS MODAL */}
      <Modal
        isOpen={Boolean(selectedOrderForStatus)}
        onClose={() => setSelectedOrderForStatus(null)}
        size="md"
        isLoading={actionLoading}
        title={t("orders.updateStatus", { defaultValue: "Update Order Status" })}
        subtitle={selectedOrderForStatus ? `Order #${selectedOrderForStatus.orderNumber}` : undefined}
        bodyClassName="p-6"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setSelectedOrderForStatus(null)}
              disabled={actionLoading}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveStatusUpdate}
              loading={actionLoading}
            >
              {t("orders.updateStatus", { defaultValue: "Update Status" })}
            </Button>
          </>
        }
      >
        {selectedOrderForStatus && (
          <form id="order-status-form" onSubmit={handleSaveStatusUpdate} className="space-y-4">
            <div>
              <Select
                label={t("orders.fulfillmentStatus", { defaultValue: "Fulfilment Status" })}
                required
                size="sm"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                fullWidth
              >
                {ORDER_STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
              {newStatus === "DELIVERED" && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  ✓ {t("orders.deliveredNote", { defaultValue: "Setting to DELIVERED starts the customer's 7-day return policy window." })}
                </p>
              )}
            </div>

            <Select
              label={t("orders.paymentStatus", { defaultValue: "Payment Status" })}
              optional
              size="sm"
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
              fullWidth
            >
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </Select>

            <Textarea
              label={t("orders.adminInternalNotes", { defaultValue: "Admin Internal Notes" })}
              optional
              size="sm"
              rows={2}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="e.g. Courier tracking ID: EXP-998811"
            />
          </form>
        )}
      </Modal>

      {/* UPDATE RETURN STATUS MODAL */}
      <Modal
        isOpen={Boolean(selectedReturnForStatus)}
        onClose={() => setSelectedReturnForStatus(null)}
        size="md"
        isLoading={actionLoading}
        title={t("orders.manageReturnRequest", { defaultValue: "Manage Return Request" })}
        subtitle={selectedReturnForStatus ? `Order #${selectedReturnForStatus.order?.orderNumber || "ORD"}` : undefined}
        bodyClassName="p-6"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setSelectedReturnForStatus(null)}
              disabled={actionLoading}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveReturnStatusUpdate}
              loading={actionLoading}
            >
              {t("orders.saveTransition", { defaultValue: "Save Transition" })}
            </Button>
          </>
        }
      >
        {selectedReturnForStatus && (
          <form id="return-status-form" onSubmit={handleSaveReturnStatusUpdate} className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs">
              <span className="text-purple-700 font-bold block">{t("orders.customerReason", { defaultValue: "Customer's Stated Reason" })}</span>
              <p className="text-purple-900 mt-0.5">{selectedReturnForStatus.reason}</p>
              {selectedReturnForStatus.details && (
                <p className="text-[11px] text-purple-700 mt-1">{selectedReturnForStatus.details}</p>
              )}
            </div>

            <div>
              <Select
                label={t("orders.transitionReturnStatus", { defaultValue: "Transition Return Status" })}
                required
                size="sm"
                value={newReturnStatus}
                onChange={(e) => setNewReturnStatus(e.target.value as ReturnStatus)}
                fullWidth
              >
                {RETURN_STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
              {newReturnStatus === "REFUNDED" && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  ✓ {t("orders.refundedNote", { defaultValue: "Marking REFUNDED will automatically restore product inventory stock and set payment status to REFUNDED." })}
                </p>
              )}
              {newReturnStatus === "REJECTED" && (
                <p className="text-[11px] text-rose-600 mt-1">
                  {t("orders.rejectedNote", { defaultValue: "Please provide an explanatory comment below for the customer regarding the rejection." })}
                </p>
              )}
            </div>

            <Textarea
              label={t("orders.adminFeedback", { defaultValue: "Admin Feedback / Instructions" })}
              optional
              size="sm"
              rows={3}
              value={adminReturnComment}
              onChange={(e) => setAdminReturnComment(e.target.value)}
              placeholder="e.g. Pickup scheduled for tomorrow with BlueDart / Inspection verified."
            />
          </form>
        )}
      </Modal>

      {/* INSPECT ORDER DETAILS MODAL */}
      <Modal
        isOpen={Boolean(inspectOrder)}
        onClose={() => setInspectOrder(null)}
        size="2xl"
        badge={
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {t("orders.orderOverview", { defaultValue: "Order Overview" })}
          </span>
        }
        title={
          inspectOrder ? (
            <div className="flex items-center gap-2">
              <span>{t("orders.orderDetail", { number: inspectOrder.orderNumber, defaultValue: `Order #${inspectOrder.orderNumber}` })}</span>
              <button
                type="button"
                onClick={(e) => handleCopyOrderNumber(e, inspectOrder.orderNumber)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                title={t("orders.copyId", { defaultValue: "Copy Order ID" })}
              >
                {copiedId === inspectOrder.orderNumber ? (
                  <Icon name="check" size={12} className="text-emerald-600" />
                ) : (
                  <Icon name="copy" size={12} />
                )}
              </button>
            </div>
          ) : undefined
        }
        subtitle={inspectOrder ? `${t("checkout.datePlaced", { defaultValue: "Placed on" })} ${formatDate(inspectOrder.createdAt)}` : undefined}
        bodyClassName="p-6 sm:p-8 space-y-6"
        footer={
          inspectOrder ? (
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdminDownloadPdf(inspectOrder.id, "invoice", inspectOrder.orderNumber)}
                  disabled={downloadingDocId === `${inspectOrder.id}-invoice`}
                  icon={
                    downloadingDocId === `${inspectOrder.id}-invoice` ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name="download" size={13} />
                    )
                  }
                >
                  Tax Invoice (PDF)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdminDownloadPdf(inspectOrder.id, "order", inspectOrder.orderNumber)}
                  disabled={downloadingDocId === `${inspectOrder.id}-order`}
                  icon={
                    downloadingDocId === `${inspectOrder.id}-order` ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name="file-text" size={13} />
                    )
                  }
                >
                  Order Slip (PDF)
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setInspectOrder(null)}
                >
                  {t("common.close", { defaultValue: "Close" })}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const orderToEdit = inspectOrder;
                    setInspectOrder(null);
                    handleOpenStatusModal(orderToEdit);
                  }}
                  icon={<Icon name="edit" size={14} />}
                >
                  {t("orders.updateStatus", { defaultValue: "Update Status" })}
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {inspectOrder && (
          <div className="space-y-6">
            {/* Status pills bar */}
            <div className="flex items-center gap-2">
              {getStatusBadge(inspectOrder.status)}
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  inspectOrder.paymentStatus === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : inspectOrder.paymentStatus === "FAILED"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                Pay: {inspectOrder.paymentStatus}
              </span>
            </div>

            {/* Customer & Shipping 2-Column Minimal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Customer Info Card */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Icon name="user" size={14} className="text-indigo-600" /> {t("orders.customerDetails", { defaultValue: "Customer Details" })}
                </span>
                <p className="font-bold text-slate-900 text-sm">{inspectOrder.shippingAddress.fullName}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Icon name="mail" size={12} className="text-slate-400" /> {inspectOrder.user?.email || "No email on record"}
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Icon name="phone" size={12} className="text-slate-400" /> {inspectOrder.shippingAddress.phone}
                </p>
              </div>

              {/* Delivery Address Card */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Icon name="map-pin" size={14} className="text-indigo-600" /> {t("orders.deliveryAddress", { defaultValue: "Delivery Address" })}
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {inspectOrder.shippingAddress.streetAddress}, {inspectOrder.shippingAddress.city},{" "}
                  {inspectOrder.shippingAddress.state} - {inspectOrder.shippingAddress.postalCode}
                </p>
                <p className="text-[11px] text-slate-400">
                  {inspectOrder.shippingAddress.country || "India"}
                </p>
              </div>
            </div>

            {/* Customer Note if present */}
            {inspectOrder.notes && (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                <Icon name="file-text" size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">{t("checkout.deliveryNotes", { defaultValue: "Customer Delivery Note" })}:</span> {inspectOrder.notes}
                </div>
              </div>
            )}

            {/* Itemized Purchased Products */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>{t("checkout.itemsInOrder", { count: inspectOrder.items.length, defaultValue: `Ordered Items (${inspectOrder.items.length})` })}</span>
                <span className="font-mono text-slate-500">
                  {inspectOrder.items.reduce((acc, i) => acc + i.quantity, 0)} {t("orders.totalUnits", { defaultValue: "Total Units" })}
                </span>
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto">
                {inspectOrder.items.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon name="package" size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        {(item.variantAttributes || item.variant?.attributes) && (
                          <div className="mt-0.5">
                            <VariantBadge
                              attributes={(item.variantAttributes || item.variant?.attributes) as Record<string, string>}
                              sku={item.variant?.sku}
                              compact
                            />
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {t("products.qty", { defaultValue: "Qty" })}: <strong className="text-slate-800">{item.quantity}</strong> × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 flex-shrink-0">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="font-semibold text-slate-700">{t("checkout.paymentSelection", { defaultValue: "Payment Details" })}</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span>{inspectOrder.paymentMethod === "RAZORPAY" ? "Razorpay Online" : inspectOrder.paymentMethod.replace(/_/g, " ")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                    inspectOrder.paymentStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : inspectOrder.paymentStatus === "FAILED"
                      ? "bg-rose-100 text-rose-800"
                      : inspectOrder.paymentStatus === "REFUNDED"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {inspectOrder.paymentStatus}
                  </span>
                </span>
              </div>

              {inspectOrder.razorpayPaymentId && (
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400">{t("checkout.paymentId", { defaultValue: "Razorpay Payment ID" })}</span>
                  <span className="text-indigo-600 font-bold">{inspectOrder.razorpayPaymentId}</span>
                </div>
              )}

              {inspectOrder.razorpayOrderId && (
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400">Razorpay Order ID</span>
                  <span className="text-slate-600 font-bold">{inspectOrder.razorpayOrderId}</span>
                </div>
              )}

              <div className="flex justify-between pt-1">
                <span>{t("cart.subtotal", { defaultValue: "Items Subtotal" })}</span>
                <span className="font-semibold text-slate-900">{formatPrice(inspectOrder.subtotal)}</span>
              </div>
              {inspectOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{t("cart.savings", { defaultValue: "Coupon Discount" })} ({inspectOrder.couponCode || "Promo"})</span>
                  <span>- {formatPrice(inspectOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t("cart.shipping", { defaultValue: "Shipping & Handling" })}</span>
                <span className="font-semibold text-slate-900">
                  {inspectOrder.shippingFee === 0 ? t("cart.free", { defaultValue: "FREE" }) : formatPrice(inspectOrder.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>{t("cart.total", { defaultValue: "Grand Total Paid" })}</span>
                <span className="text-indigo-600 font-black">{formatPrice(inspectOrder.grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* INSPECT RETURN DETAILS MODAL */}
      <Modal
        isOpen={Boolean(inspectReturn)}
        onClose={() => setInspectReturn(null)}
        size="lg"
        badge={
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            {t("orders.returnRequestBadge", { defaultValue: "Return Request" })}
          </span>
        }
        title={inspectReturn ? `Order #${inspectReturn.order?.orderNumber || "ORD"}` : undefined}
        bodyClassName="p-6 sm:p-8 space-y-6"
        footer={
          inspectReturn ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setInspectReturn(null)}
              >
                {t("common.close", { defaultValue: "Close" })}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  const retToEdit = inspectReturn;
                  setInspectReturn(null);
                  handleOpenReturnStatusModal(retToEdit);
                }}
                icon={<Icon name="edit" size={14} />}
              >
                {t("orders.updateReturnStatus", { defaultValue: "Update Return Status" })}
              </Button>
            </>
          ) : null
        }
      >
        {inspectReturn && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">{t("orders.returnStatus", { defaultValue: "Return Status" })}</span>
              <div>{getReturnStatusBadge(inspectReturn.status)}</div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">{t("orders.refundAmount", { defaultValue: "Refund Amount" })}</span>
              <span className="font-bold text-purple-900 text-sm">
                {formatPrice(inspectReturn.refundAmount)}
              </span>
            </div>

            <div className="py-2 border-b border-gray-100">
              <span className="text-gray-500 block mb-1">{t("orders.reasonForReturn", { defaultValue: "Reason for Return" })}</span>
              <span className="font-bold text-gray-900">{inspectReturn.reason}</span>
              {inspectReturn.details && (
                <p className="text-gray-600 mt-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {inspectReturn.details}
                </p>
              )}
            </div>

            {inspectReturn.adminComment && (
              <div className="py-2 border-b border-gray-100">
                <span className="text-gray-500 block mb-1">{t("orders.adminComment", { defaultValue: "Admin Comment" })}</span>
                <p className="text-indigo-900 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 font-medium">
                  {inspectReturn.adminComment}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1">
              <div>
                <span className="block font-semibold text-gray-500">{t("orders.requestedAt", { defaultValue: "Requested At" })}:</span>
                <span>{formatDate(inspectReturn.createdAt)}</span>
              </div>
              {inspectReturn.pickedUpAt && (
                <div>
                  <span className="block font-semibold text-gray-500">{t("orders.pickedUpAt", { defaultValue: "Picked Up At" })}:</span>
                  <span>{formatDate(inspectReturn.pickedUpAt)}</span>
                </div>
              )}
              {inspectReturn.receivedAt && (
                <div>
                  <span className="block font-semibold text-gray-500">{t("orders.receivedAt", { defaultValue: "Received At" })}:</span>
                  <span>{formatDate(inspectReturn.receivedAt)}</span>
                </div>
              )}
              {inspectReturn.refundedAt && (
                <div>
                  <span className="block font-semibold text-gray-500">{t("orders.refundedAt", { defaultValue: "Refunded At" })}:</span>
                  <span>{formatDate(inspectReturn.refundedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;

