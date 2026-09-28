import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { toast } from "react-toastify";
import { Icon } from "../../assets";
import { useOrder } from "../../hooks/useOrder";
import { ROUTES } from "../../config/routes";
import { formatPrice, formatDate, getImageUrl } from "../../utils";

export const OrderSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { currentOrder, fetchOrderById, downloadOrderPdf, loading } = useOrder();
  const [copied, setCopied] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!currentOrder) return;
    try {
      setDownloadingInvoice(true);
      await downloadOrderPdf(currentOrder.id, "invoice", {
        customFilename: `TaxInvoice-${currentOrder.orderNumber}.pdf`,
      });
      toast.success("Tax Invoice PDF downloaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to download invoice.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderById(id);
    }
  }, [id, fetchOrderById]);

  const handleCopyOrderNumber = () => {
    if (currentOrder?.orderNumber) {
      navigator.clipboard.writeText(currentOrder.orderNumber);
      setCopied(true);
      toast.success("Order reference copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && !currentOrder) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-xs w-full mx-4">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h3 className="text-xs font-bold text-slate-800">{t("orders.confirmingOrder", "Confirming your order...")}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Fetching receipt summary</p>
        </div>
      </div>
    );
  }

  const order = currentOrder;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Main Minimal Receipt Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200/80 text-center">
          {/* Minimalist Success Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-emerald-100 ring-8 ring-emerald-50/50">
            <Icon name="check" size={24} className="stroke-[2.5]" />
          </div>

          <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border inline-block mb-2 ${
            order?.paymentStatus === "COMPLETED"
              ? "text-emerald-700 bg-emerald-50 border-emerald-200/70"
              : order?.paymentMethod === "CASH_ON_DELIVERY"
              ? "text-amber-700 bg-amber-50 border-amber-200/70"
              : "text-indigo-700 bg-indigo-50 border-indigo-200/70"
          }`}>
            {order?.paymentStatus === "COMPLETED"
              ? "Payment Verified & Confirmed"
              : order?.paymentMethod === "CASH_ON_DELIVERY"
              ? "Cash on Delivery Order Placed"
              : "Order Placed - Payment Pending"}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("orders.thankYouTitle", "Thank you for your order!")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {t("orders.thankYouSubtitle", "Your order has been received and is now being processed for delivery.")}
          </p>

          {/* Order Reference & Razorpay Payment ID */}
          {order && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">{t("orders.orderNumber", "Order Number")}:</span>
                <span className="font-mono font-bold text-indigo-600">{order.orderNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="ml-1 p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Copy order number"
                >
                  {copied ? <Icon name="check" size={12} className="text-emerald-600" /> : <Icon name="copy" size={12} />}
                </button>
              </div>

              {order.razorpayPaymentId && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50/60 rounded-xl border border-indigo-200/80 text-xs text-indigo-900">
                  <Icon name="shield" size={13} className="text-indigo-600" />
                  <span className="text-slate-500 font-medium">Payment ID:</span>
                  <span className="font-mono font-bold text-indigo-700">{order.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          )}

          {/* Key Details Grid */}
          {order && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left border-y border-slate-100 py-4">
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {t("orders.datePlaced", "Date Placed")}
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                  {formatDate(order.createdAt)}
                </span>
              </div>

              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {t("orders.paymentMode", "Payment Mode")}
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                  {order.paymentMethod === "RAZORPAY"
                    ? "Razorpay Online"
                    : order.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {t("orders.deliverTo", "Deliver To")}
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              </div>

              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {t("orders.totalPaid", "Total Paid")}
                </span>
                <span className="text-xs font-black text-indigo-600 mt-0.5 block">
                  {formatPrice(order.grandTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Itemized Order Products */}
          {order && (
            <div className="mt-6 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {t("orders.itemsOrdered", "Items Ordered")} ({order.items.length})
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Qty: <strong className="text-slate-800">{item.quantity}</strong> × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 flex-shrink-0">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}

                {/* Price Breakdown */}
                <div className="pt-3 mt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>{t("cart.subtotal", "Subtotal")}</span>
                    <span className="font-semibold text-slate-900">{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount ({order.couponCode || "Coupon"})</span>
                      <span>- {formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t("cart.shipping", "Shipping Fee")}</span>
                    <span className="font-semibold text-slate-900">
                      {order.shippingFee === 0 ? t("cart.free", "FREE") : formatPrice(order.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>{t("cart.total", "Total Amount")}</span>
                    <span className="text-indigo-600">{formatPrice(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {order && (
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {downloadingInvoice ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="download" size={14} />
                )}
                <span>{t("orders.downloadInvoice", "Download Invoice (PDF)")}</span>
              </button>
            )}

            {order && (
              <Link
                to={ROUTES.ORDER_DETAIL(order.id)}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
              >
                {t("orders.trackLiveOrder", "Track Live Order")} <Icon name="arrow-right" size={14} />
              </Link>
            )}

            <Link
              to={ROUTES.ORDERS}
              className="w-full sm:w-auto px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Icon name="package" size={14} /> {t("orders.viewAllOrders", "View All Orders")}
            </Link>
          </div>

          {/* Minimal Guarantee Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
            <span>✓ {t("products.hassleFreeReturnNotice", "7-Day Replacements")}</span>
            <span>•</span>
            <span>✓ {t("home.trust.authenticTitle", "Authentic Items Guaranteed")}</span>
            <span>•</span>
            <span>✓ 24/7 Customer Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

