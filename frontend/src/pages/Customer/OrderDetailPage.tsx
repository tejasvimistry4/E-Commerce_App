import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon } from "../../assets";
import { useOrder } from "../../hooks/useOrder";
import { ROUTES } from "../../config/routes";
import { MESSAGES } from "../../constants/messages";
import { OrderStatus, ReturnStatus } from "../../types/order";
import { formatPrice, formatDate, getImageUrl, launchRazorpayCheckout } from "../../utils";
import { Modal, Button, Textarea, Select } from "../../components/common";
import { VariantBadge } from "../../components/products/VariantBadge";

export const OrderDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const {
    currentOrder,
    fetchOrderById,
    cancelOrder,
    requestOrderReturn,
    verifyPayment,
    reportPaymentFailed,
    retryPayment,
    downloadOrderPdf,
    loading,
    actionLoading,
  } = useOrder();

  const RETURN_REASONS = useMemo(() => [
    "Defective or damaged product",
    "Wrong item received",
    "Product quality not as expected",
    "Size or fit issue",
    "Missing parts or accessories",
    "Item arrived too late",
    "Changed mind / No longer needed",
    "Other",
  ], []);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDetails, setReturnDetails] = useState("");

  const [copied, setCopied] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [downloadingType, setDownloadingType] = useState<"order" | "invoice" | null>(null);

  const handleDownloadDoc = async (type: "order" | "invoice") => {
    if (!currentOrder) return;
    try {
      setDownloadingType(type);
      await downloadOrderPdf(currentOrder.id, type, {
        customFilename: `${type === "invoice" ? "TaxInvoice" : "OrderReceipt"}-${currentOrder.orderNumber}.pdf`,
      });
      toast.success(
        type === "invoice"
          ? "Tax Invoice PDF downloaded successfully!"
          : "Order Receipt PDF downloaded successfully!"
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to download PDF document.");
    } finally {
      setDownloadingType(null);
    }
  };


  useEffect(() => {
    if (!id) return;

    const refreshData = () => {
      fetchOrderById(id);
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
  }, [id, fetchOrderById]);

  const handleCopyOrderNumber = () => {
    if (currentOrder?.orderNumber) {
      navigator.clipboard.writeText(currentOrder.orderNumber);
      setCopied(true);
      toast.success(t("common.copied", { defaultValue: "Order # copied!" }));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate 7-day return window eligibility
  const returnWindowData = useMemo(() => {
    if (!currentOrder || currentOrder.status !== "DELIVERED") return null;

    const deliveredDate = currentOrder.deliveredAt
      ? new Date(currentOrder.deliveredAt)
      : currentOrder.updatedAt
        ? new Date(currentOrder.updatedAt)
        : new Date(currentOrder.createdAt);

    const returnUntilDate = currentOrder.returnUntil
      ? new Date(currentOrder.returnUntil)
      : new Date(deliveredDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const now = new Date();
    const diffMs = returnUntilDate.getTime() - now.getTime();
    const isEligible = diffMs > 0;
    const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const hoursRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

    return {
      deliveredDate,
      returnUntilDate,
      isEligible,
      daysRemaining,
      hoursRemaining,
    };
  }, [currentOrder]);

  if (loading && !currentOrder) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-sm w-full mx-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-800">Loading order milestones...</h3>
          <p className="text-xs text-slate-400 mt-1">Retrieving latest status updates</p>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
          <Icon name="x-circle" size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Order Not Located</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          We could not find the requested order in your account records.
        </p>
        <Link
          to={ROUTES.ORDERS}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-sm active:scale-[0.99]"
        >
          <Icon name="arrow-left" size={16} /> Back to All Orders
        </Link>
      </div>
    );
  }

  const order = currentOrder;
  const isCancellable = order.status === "PENDING" || order.status === "PROCESSING";

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case "PENDING":
        return 1;
      case "PROCESSING":
        return 2;
      case "SHIPPED":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0;
    }
  };

  const getReturnStepIndex = (status: ReturnStatus): number => {
    switch (status) {
      case "REQUESTED":
        return 1;
      case "APPROVED":
        return 2;
      case "PICKED_UP":
        return 3;
      case "RECEIVED":
        return 4;
      case "REFUNDED":
        return 5;
      case "REJECTED":
        return 2;
      default:
        return 1;
    }
  };

  const currentStep = getStepIndex(order.status);
  const currentReturnStep = order.returnRequest ? getReturnStepIndex(order.returnRequest.status) : 0;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error("Please enter a reason for cancellation");
      return;
    }

    try {
      await cancelOrder(order.id, cancelReason);
      toast.success(MESSAGES.ORDERS.CANCEL_SUCCESS);
      setShowCancelModal(false);
      setCancelReason("");
    } catch (err: any) {
      toast.error(err || MESSAGES.ORDERS.CANCEL_FAILED);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      toast.error("Please select a return reason.");
      return;
    }

    try {
      await requestOrderReturn(order.id, {
        reason: returnReason.trim(),
        details: returnDetails.trim() || undefined,
      });
      toast.success("Return request submitted successfully! Our team will review your request shortly.");
      setShowReturnModal(false);
      setReturnDetails("");
    } catch (err: any) {
      toast.error(err || "Failed to submit return request.");
    }
  };

  const isPaymentPendingOrFailed =
    (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED") &&
    order.paymentMethod !== "CASH_ON_DELIVERY" &&
    order.status !== "CANCELLED";

  const handleRetryOnlinePayment = async () => {
    if (!order) return;
    try {
      setRetryingPayment(true);
      const res = await retryPayment(order.id);
      if (res.razorpay) {
        await launchRazorpayCheckout({
          razorpayData: res.razorpay,
          orderId: order.id,
          onSuccess: async (verificationPayload) => {
            try {
              toast.info("Verifying payment security signature...");
              await verifyPayment(verificationPayload);
              toast.success("Payment verified! Your order is now being processed.");
              fetchOrderById(order.id);
            } catch (vErr: any) {
              toast.error(vErr || "Payment verification failed. Please contact support.");
            } finally {
              setRetryingPayment(false);
            }
          },
          onDismiss: () => {
            setRetryingPayment(false);
            toast.warn("Payment window was closed.");
          },
          onFailure: async (errorInfo) => {
            setRetryingPayment(false);
            try {
              await reportPaymentFailed({
                orderId: order.id,
                errorCode: errorInfo.code,
                errorReason: errorInfo.description,
                paymentId: errorInfo.paymentId,
              });
              fetchOrderById(order.id);
            } catch (fErr) {
              console.warn("Failed to report payment failure:", fErr);
            }
            toast.error(`Payment failed: ${errorInfo.description || "Transaction was declined."}`);
          },
        });
      } else {
        setRetryingPayment(false);
        toast.info("Order status updated.");
      }
    } catch (err: any) {
      setRetryingPayment(false);
      toast.error(err || "Failed to initiate payment retry.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <Link
              to={ROUTES.ORDERS}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <Icon name="arrow-left" size={16} /> {t("orders.title", { defaultValue: "Back to All Orders" })}
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Download Official Tax Invoice */}
              <button
                type="button"
                onClick={() => handleDownloadDoc("invoice")}
                disabled={Boolean(downloadingType)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Download Official Tax Invoice (PDF)"
              >
                {downloadingType === "invoice" ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="download" size={14} className="text-indigo-600" />
                )}
                <span>{t("orders.downloadInvoice", { defaultValue: "Tax Invoice (PDF)" })}</span>
              </button>

              {/* Download Order Slip / Receipt */}
              <button
                type="button"
                onClick={() => handleDownloadDoc("order")}
                disabled={Boolean(downloadingType)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Download Order Slip Receipt (PDF)"
              >
                {downloadingType === "order" ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="file-text" size={14} className="text-slate-500" />
                )}
                <span>{t("orders.orderReceipt", { defaultValue: "Order PDF" })}</span>
              </button>

              {/* Print Quick View */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
                title="Print Web View"
              >
                <Icon name="printer" size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  {t("checkout.trackLiveOrder", { defaultValue: "Live Tracking" })}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {t("orders.orderPlaced", { defaultValue: "Placed on" })} {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {t("orders.orderDetail", { number: order.orderNumber, defaultValue: `Order Details #${order.orderNumber}` })}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={t("common.copy", { defaultValue: "Copy Order #" })}
                >
                  <span>#{order.orderNumber}</span>
                  {copied ? (
                    <Icon name="check" size={14} className="text-emerald-600" />
                  ) : (
                    <Icon name="copy" size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* UNPAID / PAYMENT REQUIRED ACTION BANNER */}
        {isPaymentPendingOrFailed && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 text-xs shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                <Icon name="alert-triangle" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    {order.paymentStatus === "FAILED" ? "Payment Failed" : "Payment Required / Incomplete"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/60">
                    {t("common.attentionRequired", { defaultValue: "Action Required" })}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed max-w-xl">
                  {order.paymentStatus === "FAILED"
                    ? "Your previous payment attempt did not complete. Click below to retry securely using Razorpay."
                    : "This order is awaiting payment confirmation before it can be processed and dispatched."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetryOnlinePayment}
              disabled={retryingPayment || actionLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 flex-shrink-0 cursor-pointer"
            >
              {retryingPayment ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("checkout.connectingRazorpay", { defaultValue: "Connecting to Razorpay..." })}
                </>
              ) : (
                <>
                  <Icon name="credit-card" size={16} /> {t("checkout.payCompleteOrder", { price: formatPrice(order.grandTotal), defaultValue: `Pay Now (${formatPrice(order.grandTotal)})` })}
                </>
              )}
            </button>
          </div>
        )}


        {/* Cancellation Notice Banner if Cancelled */}
        {order.status === "CANCELLED" && (
          <div className="mb-8 p-5 rounded-3xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg flex-shrink-0">
              <Icon name="x-circle" size={20} />
            </div>
            <div>
              <h3 className="font-black text-rose-900 text-sm">{t("orders.cancelled", { defaultValue: "Order Cancelled" })}</h3>
              <p className="mt-0.5 text-rose-700 leading-relaxed">
                Reason: {order.cancelReason || "Cancelled upon request"}
              </p>
              {order.cancelledAt && (
                <p className="text-[11px] text-rose-500 mt-1 font-mono">
                  Recorded on {formatDate(order.cancelledAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* RETURN STATUS TRACKER STEPPER (When return is requested) */}
        {order.returnRequest && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />

            {/* Return Tracker Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                    Return & Refund Status
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Requested on {formatDate(order.returnRequest.createdAt)}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  Return Request for Order #{order.orderNumber}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Reason: <span className="font-bold text-slate-800">"{order.returnRequest.reason}"</span>
                  {order.returnRequest.details && ` — ${order.returnRequest.details}`}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-2xs self-start sm:self-auto uppercase tracking-wide bg-purple-50 text-purple-700 border-purple-200/70">
                <span
                  className={`w-2 h-2 rounded-full ${order.returnRequest.status === "REFUNDED"
                    ? "bg-emerald-500"
                    : order.returnRequest.status === "REJECTED"
                      ? "bg-rose-500"
                      : "bg-purple-600 animate-pulse"
                    }`}
                />
                <span>{order.returnRequest.status.replace(/_/g, " ")}</span>
              </div>
            </div>

            {/* Rejection / Admin Notice */}
            {order.returnRequest.status === "REJECTED" && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                <Icon name="alert-triangle" size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Return Request Rejected by Support Team</span>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    {order.returnRequest.adminComment || "The return request does not meet policy requirements."}
                  </p>
                </div>
              </div>
            )}

            {order.returnRequest.adminComment && order.returnRequest.status !== "REJECTED" && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
                <Icon name="help-circle" size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Fulfilment Center Instructions</span>
                  <p className="text-[11px] text-indigo-700 mt-0.5">{order.returnRequest.adminComment}</p>
                </div>
              </div>
            )}

            {/* Return Stepper */}
            {(() => {
              const isRejected = order.returnRequest?.status === "REJECTED";
              const returnSteps: {
                num: number;
                title: string;
                desc: string;
                date: string;
              }[] = [
                  {
                    num: 1,
                    title: "Return Requested",
                    desc: "Request received & logged",
                    date: formatDate(order.returnRequest!.createdAt),
                  },
                  {
                    num: 2,
                    title: isRejected ? "Request Rejected" : "Return Approved",
                    desc: isRejected ? "Review completed" : "Authorized for pickup",
                    date: currentReturnStep >= 2 ? (isRejected ? "Rejected" : "Approved") : "Pending Review",
                  },
                  {
                    num: 3,
                    title: "Package Picked Up",
                    desc: "Courier picked up item",
                    date: order.returnRequest!.pickedUpAt
                      ? formatDate(order.returnRequest!.pickedUpAt)
                      : currentReturnStep >= 3
                        ? "In Transit"
                        : "Awaiting Pickup",
                  },
                  {
                    num: 4,
                    title: "Received at Warehouse",
                    desc: "Quality inspection verified",
                    date: order.returnRequest!.receivedAt
                      ? formatDate(order.returnRequest!.receivedAt)
                      : currentReturnStep >= 4
                        ? "Verified"
                        : "Expected",
                  },
                  {
                    num: 5,
                    title: `Refund (${formatPrice(order.returnRequest!.refundAmount)})`,
                    desc: "Credited to payment method",
                    date: order.returnRequest!.refundedAt
                      ? formatDate(order.returnRequest!.refundedAt)
                      : currentReturnStep === 5
                        ? "Refunded"
                        : "Pending",
                  },
                ];

              return (
                <div className="relative">
                  {/* Desktop Return Stepper */}
                  <div className="hidden sm:block relative max-w-4xl mx-auto px-4 py-2">
                    <div className="absolute top-6 left-10 right-10 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isRejected
                          ? "bg-rose-500"
                          : "bg-indigo-600"
                          }`}
                        style={{
                          width: `${Math.max(
                            0,
                            ((currentReturnStep - 1) / (returnSteps.length - 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="relative z-10 grid grid-cols-5 gap-2">
                      {returnSteps.map((st) => {
                        const isCompleted = currentReturnStep > st.num;
                        const isCurrent = currentReturnStep === st.num;

                        return (
                          <div key={st.num} className="flex flex-col items-center text-center px-1">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all shadow-xs ${isRejected && st.num === 2
                                ? "bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-50"
                                : isCompleted
                                  ? "bg-emerald-600 text-white shadow-emerald-600/25 ring-4 ring-emerald-50"
                                  : isCurrent
                                    ? "bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-50 scale-105"
                                    : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}
                            >
                              {isCompleted ? (
                                <Icon name="check" size={16} />
                              ) : isRejected && st.num === 2 ? (
                                <Icon name="x-circle" size={16} />
                              ) : (
                                <span>{st.num}</span>
                              )}
                            </div>

                            <div className="mt-2.5 space-y-0.5 max-w-[120px]">
                              <span
                                className={`text-[11px] font-black tracking-tight block ${isCurrent
                                  ? "text-purple-700"
                                  : isCompleted
                                    ? "text-slate-900"
                                    : "text-slate-500"
                                  }`}
                              >
                                {st.title}
                              </span>
                              <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                                {st.desc}
                              </p>
                              <span className="text-[9px] font-mono text-slate-400 block pt-0.5">
                                {st.date}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Return Stepper */}
                  <div className="block sm:hidden space-y-4 pt-2">
                    {returnSteps.map((st, idx) => {
                      const isCompleted = currentReturnStep > st.num;
                      const isCurrent = currentReturnStep === st.num;
                      const isLast = idx === returnSteps.length - 1;

                      return (
                        <div key={st.num} className="flex items-start gap-3 relative">
                          {!isLast && (
                            <div
                              className={`absolute left-4 top-8 w-0.5 h-10 -translate-x-1/2 ${isCompleted ? "bg-emerald-500" : "bg-slate-200"
                                }`}
                            />
                          )}

                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 ${isRejected && st.num === 2
                              ? "bg-rose-600 text-white"
                              : isCompleted
                                ? "bg-emerald-600 text-white"
                                : isCurrent
                                  ? "bg-purple-600 text-white ring-2 ring-purple-100"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                          >
                            {isCompleted ? <Icon name="check" size={14} /> : st.num}
                          </div>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900">{st.title}</h4>
                              <span className="text-[10px] font-mono text-slate-400">{st.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{st.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Live Milestone Tracking Stepper (Delivery) */}
        {order.status !== "CANCELLED" && (() => {
          const steps: {
            stepNum: number;
            title: string;
            desc: string;
            date: string;
            iconName: "clock" | "package" | "truck" | "check-circle";
          }[] = [
              {
                stepNum: 1,
                title: "Order Placed",
                desc: "Verified & Confirmed",
                date: formatDate(order.createdAt),
                iconName: "clock",
              },
              {
                stepNum: 2,
                title: "In Packing",
                desc: "Quality Check & Packed",
                date: currentStep > 2 ? "Completed" : currentStep === 2 ? "In Progress" : "Pending",
                iconName: "package",
              },
              {
                stepNum: 3,
                title: "In Transit",
                desc: "Dispatched via Express Courier",
                date: currentStep > 3 ? "Completed" : currentStep === 3 ? "On the Way" : "Expected",
                iconName: "truck",
              },
              {
                stepNum: 4,
                title: "Delivered",
                desc: "Delivered to Recipient",
                date: order.deliveredAt
                  ? formatDate(order.deliveredAt)
                  : currentStep === 4
                    ? (order.updatedAt ? formatDate(order.updatedAt) : "Delivered")
                    : "Expected Soon",
                iconName: "check-circle",
              },
            ];

          const getStatusBanner = () => {
            switch (order.status) {
              case "PENDING":
                return {
                  title: "Order Confirmed & Payment Verified",
                  desc: "Your order details have been securely authorized and queued for warehouse dispatch.",
                  badge: "Order Placed",
                  badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
                  dotColor: "bg-amber-500",
                };
              case "PROCESSING":
                return {
                  title: "Items Picked & Under Quality Packaging",
                  desc: "Our inventory team is preparing and packing your items with tamper-evident seal.",
                  badge: "In Processing",
                  badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                  dotColor: "bg-blue-500",
                };
              case "SHIPPED":
                return {
                  title: "Package In Transit to Your Destination",
                  desc: `Courier partner is actively delivering your package to ${order.shippingAddress.city}, ${order.shippingAddress.state}.`,
                  badge: "In Transit",
                  badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
                  dotColor: "bg-purple-500",
                };
              case "DELIVERED":
                return {
                  title: "Package Successfully Delivered",
                  desc: `Delivered safely to ${order.shippingAddress.fullName} at ${order.shippingAddress.city}.`,
                  badge: "Delivered",
                  badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  dotColor: "bg-emerald-500",
                };
              default:
                return {
                  title: "Live Milestone Progress",
                  desc: "Tracking live updates from fulfilment center.",
                  badge: order.status,
                  badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
                  dotColor: "bg-slate-500",
                };
            }
          };

          const statusBanner = getStatusBanner();

          return (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-8">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Live Dispatch Status
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {statusBanner.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {statusBanner.desc}
                  </p>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs self-start sm:self-auto ${statusBanner.badgeColor}`}>
                  <span className={`w-2 h-2 rounded-full ${statusBanner.dotColor} ${order.status !== 'DELIVERED' ? 'animate-pulse' : ''}`} />
                  <span>{statusBanner.badge}</span>
                </div>
              </div>

              {/* Delivery ETA Strip */}
              <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 flex items-center justify-center text-base shadow-xs flex-shrink-0 border border-slate-200/60">
                    <Icon name="truck" size={18} />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Destination & Delivery Window</span>
                    <span className="font-bold text-slate-900">
                      {order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.postalCode}) • 3-5 Business Days
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-slate-200 text-slate-600 font-mono text-[11px] font-bold self-start sm:self-auto">
                  <span className="text-slate-400 font-sans">AWB:</span>
                  <span className="text-indigo-600 font-bold">EXP-{order.orderNumber.replace('ORD-', '')}</span>
                </div>
              </div>

              {/* Desktop / Tablet Horizontal Stepper */}
              <div className="hidden sm:block relative max-w-4xl mx-auto px-6 py-2">
                <div className="absolute top-6 left-12 right-12 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="relative z-10 grid grid-cols-4 gap-2">
                  {steps.map((st) => {
                    const isCompleted = currentStep > st.stepNum;
                    const isCurrent = currentStep === st.stepNum;

                    return (
                      <div key={st.stepNum} className="flex flex-col items-center text-center px-1">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold transition-all duration-300 shadow-xs ${isCompleted
                            ? "bg-emerald-600 text-white shadow-emerald-600/25 ring-4 ring-emerald-50"
                            : isCurrent
                              ? "bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-50 scale-105"
                              : "bg-slate-100 text-slate-400 border border-slate-200/80"
                            }`}
                        >
                          {isCompleted ? (
                            <Icon name="check" size={18} />
                          ) : (
                            <Icon name={st.iconName} size={18} />
                          )}
                        </div>

                        <div className="mt-3 space-y-0.5 max-w-[140px]">
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={`text-xs font-black tracking-tight ${isCurrent
                                ? "text-indigo-600"
                                : isCompleted
                                  ? "text-slate-900"
                                  : "text-slate-500"
                                }`}
                            >
                              {st.title}
                            </span>
                            {isCurrent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight font-medium line-clamp-2">
                            {st.desc}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 block pt-0.5 font-semibold">
                            {st.date}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Vertical Timeline */}
              <div className="block sm:hidden space-y-6 pt-2">
                {steps.map((st, index) => {
                  const isCompleted = currentStep > st.stepNum;
                  const isCurrent = currentStep === st.stepNum;
                  const isLast = index === steps.length - 1;

                  return (
                    <div key={st.stepNum} className="flex items-start gap-4 relative">
                      {!isLast && (
                        <div
                          className={`absolute left-5 top-10 w-0.5 h-12 -translate-x-1/2 ${isCompleted ? "bg-emerald-500" : "bg-slate-200"
                            }`}
                        />
                      )}

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 transition-all ${isCompleted
                          ? "bg-emerald-600 text-white shadow-emerald-600/20"
                          : isCurrent
                            ? "bg-indigo-600 text-white shadow-xs ring-4 ring-indigo-50"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                      >
                        {isCompleted ? <Icon name="check" size={16} /> : <Icon name={st.iconName} size={16} />}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-black ${isCurrent
                              ? "text-indigo-600"
                              : isCompleted
                                ? "text-slate-900"
                                : "text-slate-500"
                              }`}
                          >
                            {st.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {st.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{st.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 7-DAY RETURN POLICY & ELIGIBILITY CARD (When DELIVERED) */}
        {order.status === "DELIVERED" && returnWindowData && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs mb-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                  <Icon name="shield" size={14} className="text-emerald-600" />
                  <span>{t("footer.guaranteeReplacements", { defaultValue: "7-Day Return Guarantee" })}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {returnWindowData.isEligible
                    ? "Need a return or refund for this order?"
                    : "7-Day Return Period Has Ended"}
                </h2>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  {returnWindowData.isEligible
                    ? `You have ${returnWindowData.daysRemaining} days and ${returnWindowData.hoursRemaining} hours left to request a hassle-free return (eligible until ${formatDate(returnWindowData.returnUntilDate)}).`
                    : `The 7-day return window closed on ${formatDate(returnWindowData.returnUntilDate)}. Standard manufacturer warranty remains active.`}
                </p>
              </div>

              {/* Action Button */}
              {returnWindowData.isEligible && !order.returnRequest && (
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black tracking-wide shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto flex-shrink-0"
                >
                  <Icon name="refresh" size={16} />
                  <span>{t("orders.requestReturn", { defaultValue: "Request Return" })}</span>
                </button>
              )}

              {order.returnRequest && (
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 self-start md:self-auto">
                  <Icon name="check-circle" size={16} className="text-emerald-600" />
                  <span>Return Request Submitted</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Items List & Actions (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Icon name="package" size={18} className="text-indigo-600" />
                  {t("orders.orderSummary", { defaultValue: "Purchased Items" })} ({order.items.length})
                </h2>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {order.items.reduce((acc, i) => acc + i.quantity, 0)} {t("common.items", { defaultValue: "items" })}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 flex-shrink-0 shadow-xs">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon name="package" size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h3>
                      {(item.variantAttributes || item.variant?.attributes) && (
                        <div className="mt-1">
                          <VariantBadge
                            attributes={(item.variantAttributes || item.variant?.attributes) as Record<string, string>}
                            sku={item.variant?.sku}
                            compact
                          />
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1">
                        Qty: <span className="font-bold text-slate-800">{item.quantity}</span> × {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-xs font-black text-slate-900 text-right">
                      {formatPrice(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quality Guarantee Note */}
              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
                <Icon name="shield" size={16} className="text-indigo-600 flex-shrink-0" />
                <span>{t("footer.guaranteeAuthentic", { defaultValue: "Backed by 7-day hassle-free replacements and authentic manufacturer warranty." })}</span>
              </div>
            </div>

            {/* Cancel Order Section (if eligible) */}
            {isCancellable && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Need to cancel this shipment?</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Orders can be cancelled before dispatch without cancellation penalty.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all flex-shrink-0 cursor-pointer"
                >
                  {t("orders.cancelOrder", { defaultValue: "Cancel Order" })}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Address & Payment Summary (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Icon name="map-pin" size={14} className="text-indigo-600" /> {t("checkout.deliverTo", { defaultValue: "Delivery Address" })}
              </h2>
              <p className="font-bold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {order.shippingAddress.streetAddress}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state} - {order.shippingAddress.postalCode},{" "}
                {order.shippingAddress.country || "India"}
              </p>
              <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
                <Icon name="phone" size={14} className="text-slate-400" /> {order.shippingAddress.phone}
              </p>
            </div>

            {/* Payment & Price Breakdown */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="credit-card" size={14} className="text-indigo-600" /> {t("checkout.paymentSelection", { defaultValue: "Payment & Billing" })}
              </h2>

              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{t("checkout.paymentMode", { defaultValue: "Method" })}</span>
                  <span className="font-bold text-slate-900">
                    {order.paymentMethod === "RAZORPAY" ? t("checkout.razorpayTitle", { defaultValue: "Razorpay Online" }) : order.paymentMethod.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">{t("common.status", { defaultValue: "Payment Status" })}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.paymentStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.paymentStatus === "FAILED"
                      ? "bg-rose-100 text-rose-800"
                      : order.paymentStatus === "REFUNDED"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>

                {order.razorpayPaymentId && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400 font-medium">{t("checkout.paymentId", { defaultValue: "Payment Ref" })}</span>
                    <span className="font-mono font-bold text-indigo-600">{order.razorpayPaymentId}</span>
                  </div>
                )}
              </div>

              {isPaymentPendingOrFailed && (
                <button
                  type="button"
                  onClick={handleRetryOnlinePayment}
                  disabled={retryingPayment || actionLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {retryingPayment ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("checkout.connectingRazorpay", { defaultValue: "Opening Razorpay..." })}
                    </>
                  ) : (
                    <>
                      <Icon name="credit-card" size={14} /> {t("checkout.payCompleteOrder", { price: formatPrice(order.grandTotal), defaultValue: `Pay with Razorpay (${formatPrice(order.grandTotal)})` })}
                    </>
                  )}
                </button>
              )}

              <div className="space-y-2.5 text-xs text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>{t("cart.subtotal", { defaultValue: "Subtotal" })}</span>
                  <span className="font-bold text-slate-900">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                    <span className="flex items-center gap-1">
                      <Icon name="tag" size={14} /> {t("cart.savings", { defaultValue: "Discount" })} ({order.couponCode || "Coupon"})
                    </span>
                    <span>- {formatPrice(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>{t("cart.shipping", { defaultValue: "Delivery Charges" })}</span>
                  {order.shippingFee === 0 ? (
                    <span className="text-emerald-600 font-black uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                      {t("cart.free", { defaultValue: "FREE" })}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900">
                      {formatPrice(order.shippingFee)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-black text-slate-900 block">{t("checkout.totalPaid", { defaultValue: "Grand Total Paid" })}</span>
                  <span className="text-[10px] text-slate-400">{t("cart.estimatedTax", { defaultValue: "Inclusive of all taxes" })}</span>
                </div>
                <span className="text-xl font-black text-slate-900">
                  {formatPrice(order.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REQUEST RETURN MODAL */}
        <Modal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          size="lg"
          isLoading={actionLoading}
          icon={<Icon name="refresh" size={20} />}
          iconBg="bg-purple-100 text-purple-700 border-purple-200"
          title={t("orders.requestReturn", { defaultValue: "Request 7-Day Return" })}
          subtitle={`Order #${order.orderNumber}`}
          bodyClassName="p-6 sm:p-8"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowReturnModal(false)}
                disabled={actionLoading}
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleReturnSubmit}
                loading={actionLoading}
              >
                {t("orders.requestReturn", { defaultValue: "Submit Return Request" })}
              </Button>
            </>
          }
        >
          <form id="return-form" onSubmit={handleReturnSubmit} className="space-y-4">
            <Select
              label="Reason for Return"
              required
              size="sm"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              options={RETURN_REASONS.map((r) => ({ value: r, label: r }))}
            />

            <Textarea
              label="Additional Details / Feedback"
              optional
              size="sm"
              rows={3}
              value={returnDetails}
              onChange={(e) => setReturnDetails(e.target.value)}
              placeholder="Provide specific details about the issue to expedite inspection..."
            />

            {/* Refund Summary Preview */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-purple-900">
                <span>Eligible Refund Amount</span>
                <span>{formatPrice(order.grandTotal)}</span>
              </div>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Refund will be credited to your original payment method ({order.paymentMethod.replace(/_/g, " ")}) once the item is inspected at our warehouse.
              </p>
            </div>
          </form>
        </Modal>

        {/* Cancellation Confirmation Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          size="md"
          isLoading={actionLoading}
          icon={<Icon name="alert-triangle" size={22} />}
          iconBg="bg-rose-100 text-rose-600 border-rose-200"
          title={`${t("orders.cancelOrder", { defaultValue: "Cancel Order" })} #${order.orderNumber}`}
          subtitle={t("orders.cancelOrderConfirm", { defaultValue: "Are you sure you want to cancel this order?" })}
          bodyClassName="p-6 sm:p-8"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
              >
                {t("common.cancel", { defaultValue: "Keep Order" })}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleCancelSubmit}
                loading={actionLoading}
              >
                {t("orders.cancelOrder", { defaultValue: "Confirm Cancellation" })}
              </Button>
            </>
          }
        >
          <form id="cancel-form" onSubmit={handleCancelSubmit} className="space-y-4">
            <Textarea
              label="Reason for Cancellation"
              required
              size="sm"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Ordered incorrect size, changed delivery location..."
            />
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default OrderDetailPage;
