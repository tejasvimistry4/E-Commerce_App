import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useOrder } from "../../hooks/useOrder";
import { useDebounce } from "../../hooks/useDebounce";
import {
  SearchInput,
  Modal,
  Button,
  Pagination,
  StatsCard,
  Badge,
  EmptyState,
} from "../../components/common";
import { Icon } from "../../assets";
import { Order, OrderStatus } from "../../types/order";
import { formatPrice, formatDate, getImageUrl } from "../../utils";
import { VariantBadge } from "../../components/products/VariantBadge";

export const VendorOrdersPage: React.FC = () => {
  const {
    adminOrders,
    adminStats,
    adminPagination,
    fetchAdminOrders,
    fetchAdminStats,
    downloadOrderPdf,
    loading,
  } = useOrder();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Inspect detail modal state
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleVendorDownloadPdf = async (
    orderId: string,
    type: "order" | "invoice",
    orderNumber: string
  ) => {
    try {
      setDownloadingDocId(`${orderId}-${type}`);
      await downloadOrderPdf(orderId, type, {
        isAdmin: true,
        customFilename: `${type === "invoice" ? "VendorInvoice" : "VendorPackingSlip"}-${orderNumber}.pdf`,
      });
      toast.success(
        type === "invoice"
          ? "Tax Invoice downloaded successfully!"
          : "Packing Slip PDF downloaded successfully!"
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to download PDF.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    toast.success(`Copied #${orderNumber}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const refreshData = () => {
      fetchAdminStats();
      fetchAdminOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearchTerm.trim() || undefined,
      });
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
  }, [currentPage, statusFilter, debouncedSearchTerm, fetchAdminOrders, fetchAdminStats]);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "DELIVERED":
        return <Badge variant="success" size="sm">DELIVERED</Badge>;
      case "SHIPPED":
        return <Badge variant="info" size="sm">SHIPPED</Badge>;
      case "PROCESSING":
        return <Badge variant="warning" size="sm">PROCESSING</Badge>;
      case "CANCELLED":
        return <Badge variant="danger" size="sm">CANCELLED</Badge>;
      case "PENDING":
      default:
        return <Badge variant="neutral" size="sm">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Customer Orders
            </span>
            <span className="text-xs text-slate-400">• Scoped Store Fulfillment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Store Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review customer orders containing your products and track fulfillment progress.
          </p>
        </div>

        <Button
          onClick={() => {
            fetchAdminStats();
            fetchAdminOrders({
              page: currentPage,
              limit: 10,
              status: statusFilter === "ALL" ? undefined : statusFilter,
              search: debouncedSearchTerm.trim() || undefined,
            });
          }}
          variant="outline"
          size="md"
          loading={loading}
          icon={<span>↻</span>}
        >
          Refresh Orders
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Store Orders"
          value={adminStats?.totalOrders ?? 0}
          subtitle="Orders Containing Your Items"
          icon={<span className="text-lg">📦</span>}
          iconBg="bg-indigo-50 border border-indigo-100"
          loading={loading && adminOrders.length === 0 && !adminStats}
        />
        <StatsCard
          title="Total Store Revenue"
          value={formatPrice(adminStats?.totalRevenue ?? 0)}
          subtitle="Completed Order Value"
          icon={<span className="text-lg">💰</span>}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700 font-black"
          badge={{ text: "Earnings", variant: "success" }}
          loading={loading && adminOrders.length === 0 && !adminStats}
        />
        <StatsCard
          title="Pending / Processing"
          value={(adminStats?.pendingOrders ?? 0) + (adminStats?.processingOrders ?? 0)}
          subtitle="Awaiting Delivery"
          icon={<span className="text-lg">⏳</span>}
          iconBg="bg-amber-50 border border-amber-100"
          valueClassName="text-amber-700"
          loading={loading && adminOrders.length === 0 && !adminStats}
        />
        <StatsCard
          title="Delivered Orders"
          value={adminStats?.deliveredOrders ?? 0}
          subtitle="Fulfilled Successfully"
          icon={<span className="text-lg">✅</span>}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          loading={loading && adminOrders.length === 0 && !adminStats}
        />
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search by order number or customer name..."
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center space-x-1.5 pt-3 border-t border-slate-100 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => {
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Order ID & Date</th>
                <th className="py-3.5 px-4 sm:px-6">Customer</th>
                <th className="py-3.5 px-4 sm:px-6">Items Ordered</th>
                <th className="py-3.5 px-4 sm:px-6">Amount</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {adminOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Order ID */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                        className="font-mono font-bold text-slate-900 hover:text-emerald-600 transition-colors text-xs flex items-center space-x-1"
                        title="Click to copy order number"
                      >
                        <span>#{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {copiedId === order.orderNumber ? "✓" : "📋"}
                        </span>
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        {order.user?.name || "Shopper"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {order.user?.email || "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800">
                        {order.items?.length || 0} items
                      </span>
                      <div className="flex items-center space-x-1 mt-1">
                        {order.items?.slice(0, 3).map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0"
                            title={item.name}
                          >
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[9px] flex items-center justify-center h-full">📦</span>
                            )}
                          </div>
                        ))}
                        {(order.items?.length || 0) > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{(order.items?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4 sm:px-6">
                    <span className="text-sm font-black text-slate-900">
                      {formatPrice(order.grandTotal)}
                    </span>
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {order.paymentMethod}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 sm:px-6">
                    {getOrderStatusBadge(order.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <button
                      type="button"
                      onClick={() => setInspectOrder(order)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}

              {adminOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      title="No orders found"
                      description="No customer orders matching your active filters were found."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {adminPagination && adminPagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <Pagination
              page={currentPage}
              totalPages={adminPagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Inspect Order Details Modal */}
      {inspectOrder && (
        <Modal
          isOpen={true}
          onClose={() => setInspectOrder(null)}
          size="2xl"
          icon={<Icon name="package" size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100 text-emerald-600"
          title={
            <div className="flex items-center gap-2">
              <span>Order #{inspectOrder.orderNumber}</span>
              <button
                type="button"
                onClick={(e) => handleCopyOrderNumber(e, inspectOrder.orderNumber)}
                className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                {copiedId === inspectOrder.orderNumber ? (
                  <Icon name="check" size={14} className="text-emerald-600" />
                ) : (
                  <Icon name="copy" size={14} />
                )}
              </button>
            </div>
          }
          subtitle={`Placed on ${formatDate(inspectOrder.createdAt)}`}
          bodyClassName="p-6 sm:p-7 space-y-6"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleVendorDownloadPdf(inspectOrder.id, "invoice", inspectOrder.orderNumber)}
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
                  onClick={() => handleVendorDownloadPdf(inspectOrder.id, "order", inspectOrder.orderNumber)}
                  disabled={downloadingDocId === `${inspectOrder.id}-order`}
                  icon={
                    downloadingDocId === `${inspectOrder.id}-order` ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name="file-text" size={13} />
                    )
                  }
                >
                  Packing Slip (PDF)
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setInspectOrder(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Status & Highlights Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fulfillment & Payment
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {getOrderStatusBadge(inspectOrder.status)}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      inspectOrder.paymentStatus === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : inspectOrder.paymentStatus === "FAILED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    Pay: {inspectOrder.paymentStatus}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {inspectOrder.paymentMethod === "RAZORPAY"
                      ? "Razorpay Online"
                      : inspectOrder.paymentMethod === "CASH_ON_DELIVERY"
                      ? "Cash on Delivery (COD)"
                      : inspectOrder.paymentMethod.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Total Amount</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatPrice(inspectOrder.grandTotal)}
                </span>
              </div>
            </div>

            {/* Customer & Shipping Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Info Card */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="user" size={14} className="text-emerald-600" /> Customer Information
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {inspectOrder.shippingAddress?.fullName || inspectOrder.user?.name || "Shopper"}
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Icon name="mail" size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{inspectOrder.user?.email || "No email on record"}</span>
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Icon name="phone" size={12} className="text-slate-400 flex-shrink-0" />
                  <span>{inspectOrder.shippingAddress?.phone || "No phone provided"}</span>
                </p>
              </div>

              {/* Delivery Destination Card */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="map-pin" size={14} className="text-emerald-600" /> Delivery Address
                </span>
                {inspectOrder.shippingAddress ? (
                  <>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {inspectOrder.shippingAddress.streetAddress}, {inspectOrder.shippingAddress.city},{" "}
                      {inspectOrder.shippingAddress.state} - {inspectOrder.shippingAddress.postalCode}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {inspectOrder.shippingAddress.country || "India"}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 italic">No delivery address provided</p>
                )}
              </div>
            </div>

            {/* Customer Note / Instructions if available */}
            {inspectOrder.notes && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <Icon name="file-text" size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-amber-950">Customer Delivery Instructions:</span>
                  <p className="mt-0.5 text-amber-800">{inspectOrder.notes}</p>
                </div>
              </div>
            )}

            {/* Itemized Ordered Products */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Ordered Products ({inspectOrder.items?.length || 0})
                </h4>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  {inspectOrder.items?.reduce((acc, i) => acc + i.quantity, 0) || 0} Total Units
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30 max-h-64 overflow-y-auto">
                {inspectOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
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
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        {(item.variantAttributes || (item as any).variant?.attributes) && (
                          <div className="mt-1">
                            <VariantBadge
                              attributes={(item.variantAttributes || (item as any).variant?.attributes) as Record<string, string>}
                              sku={(item as any).variant?.sku}
                              compact
                            />
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">
                          Qty: <strong className="text-slate-800">{item.quantity}</strong> × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-slate-900 block">
                        {formatPrice(item.totalPrice || Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {formatPrice(
                    inspectOrder.subtotal ||
                      inspectOrder.items?.reduce((s, i) => s + (i.totalPrice || Number(i.price) * i.quantity), 0) ||
                      inspectOrder.grandTotal
                  )}
                </span>
              </div>
              {inspectOrder.discount ? (
                <div className="flex justify-between items-center text-emerald-600">
                  <span>
                    Discount {inspectOrder.couponCode ? `(${inspectOrder.couponCode})` : ""}
                  </span>
                  <span className="font-semibold">-{formatPrice(inspectOrder.discount)}</span>
                </div>
              ) : null}
              {inspectOrder.shippingFee ? (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-slate-800">{formatPrice(inspectOrder.shippingFee)}</span>
                </div>
              ) : null}
              {inspectOrder.tax ? (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tax / GST</span>
                  <span className="font-semibold text-slate-800">{formatPrice(inspectOrder.tax)}</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Grand Total</span>
                <span className="text-emerald-700 font-black">{formatPrice(inspectOrder.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VendorOrdersPage;
