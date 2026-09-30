import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { toast } from "react-toastify";
import { Icon } from "../../assets";
import { useCart } from "../../hooks/useCart";
import { useOrder } from "../../hooks/useOrder";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../config/routes";
import { MESSAGES } from "../../constants/messages";
import { PaymentMethod, ShippingAddress } from "../../types/order";
import { formatPrice, getImageUrl, launchRazorpayCheckout } from "../../utils";
import { Input, Textarea } from "../../components/common";
import { VariantBadge } from "../../components/products/VariantBadge";

export const CheckoutPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { summary, items, appliedCoupon } = useCart();
  const {
    placeOrder,
    verifyPayment,
    reportPaymentFailed,
    retryPayment,
    savedAddresses,
    fetchSavedAddresses,
    actionLoading,
  } = useOrder();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Address form state
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: user?.name || "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [notes, setNotes] = useState("");

  // Payment method state (Razorpay by default or COD)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY");

  useEffect(() => {
    fetchSavedAddresses();
  }, [fetchSavedAddresses]);

  useEffect(() => {
    if (savedAddresses.length > 0 && selectedAddressId === "new") {
      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setAddressForm({
          fullName: defaultAddr.fullName,
          phone: defaultAddr.phone,
          streetAddress: defaultAddr.streetAddress,
          city: defaultAddr.city,
          state: defaultAddr.state,
          postalCode: defaultAddr.postalCode,
          country: defaultAddr.country || "India",
        });
      }
    }
  }, [savedAddresses]);

  // If cart is empty, render clean redirect
  if (!items || items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-inner">
            <Icon name="shopping-bag" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{t("cart.emptyTitle", "Your Cart is Empty")}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            {t("cart.emptySubtitle", "You don't have any items in your shopping cart to checkout. Explore our collections and add products to proceed.")}
          </p>
          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
          >
            {t("wishlist.browseProducts", "Explore Catalog")} <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    if (id === "new") {
      setAddressForm({
        fullName: user?.name || "",
        phone: "",
        streetAddress: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      });
    } else {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) {
        setAddressForm({
          fullName: addr.fullName,
          phone: addr.phone,
          streetAddress: addr.streetAddress,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country || "India",
        });
      }
    }
  };

  const validateAddressStep = (): boolean => {
    if (!addressForm.fullName.trim()) {
      toast.error(t("auth.nameRequired", "Please enter recipient full name"));
      return false;
    }
    if (!addressForm.phone.trim() || addressForm.phone.length < 10) {
      toast.error("Please provide a valid 10-digit contact phone number");
      return false;
    }
    if (!addressForm.streetAddress.trim()) {
      toast.error("Please provide street address");
      return false;
    }
    if (!addressForm.city.trim()) {
      toast.error("Please enter delivery city");
      return false;
    }
    if (!addressForm.state.trim()) {
      toast.error("Please enter delivery state");
      return false;
    }
    if (!addressForm.postalCode.trim() || addressForm.postalCode.length < 5) {
      toast.error("Please provide a valid postal / ZIP code");
      return false;
    }
    return true;
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddressStep()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextToReview = () => {
    if (!validateAddressStep()) {
      setStep(1);
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrderSubmit = async () => {
    if (!validateAddressStep()) {
      setStep(1);
      return;
    }

    try {
      setIsProcessingPayment(true);

      let order: any;
      let razorpayData: any;

      if (pendingOrderId && paymentMethod === "RAZORPAY") {
        // Reuse/refresh payment for existing pending order
        const result = await retryPayment(pendingOrderId);
        order = result.order;
        razorpayData = result.razorpay;
      } else {
        // Place initial order
        const result = await placeOrder({
          shippingAddress: addressForm,
          paymentMethod,
          couponCode: appliedCoupon?.code || undefined,
          notes: notes.trim() || undefined,
          saveAddress: selectedAddressId === "new" ? saveAddress : false,
        });
        order = result.order;
        razorpayData = result.razorpay;
        if (razorpayData) {
          setPendingOrderId(order.id);
        }
      }

      if (razorpayData) {
        // Online Payment through Razorpay SDK Modal
        await launchRazorpayCheckout({
          razorpayData,
          orderId: order.id,
          onSuccess: async (verificationPayload) => {
            try {
              toast.info("Verifying payment security signature...");
              const verifiedOrder = await verifyPayment(verificationPayload);
              setPendingOrderId(null);
              toast.success(t("messages.orders.placedSuccess", { orderNumber: verifiedOrder.orderNumber, defaultValue: `Order #${verifiedOrder.orderNumber} placed successfully!` }));
              navigate(ROUTES.CHECKOUT_SUCCESS(verifiedOrder.id));
            } catch (vErr: any) {
              toast.error(vErr || "Payment signature verification failed. Please contact support.");
              setStep(3);
            } finally {
              setIsProcessingPayment(false);
            }
          },
          onDismiss: () => {
            setIsProcessingPayment(false);
            setStep(3);
            toast.info("Payment window was closed. You can review your details and click Pay when ready.");
          },
          onFailure: async (errorInfo) => {
            setIsProcessingPayment(false);
            setStep(3);
            try {
              await reportPaymentFailed({
                orderId: order.id,
                errorCode: errorInfo.code,
                errorReason: errorInfo.description,
                paymentId: errorInfo.paymentId,
              });
            } catch (fErr) {
              console.warn("Failed to report payment failure:", fErr);
            }
            toast.error(`Payment failed: ${errorInfo.description || "Transaction was declined."} Please retry.`);
          },
        });
      } else {
        // Cash on Delivery Order
        setIsProcessingPayment(false);
        setPendingOrderId(null);
        toast.success(t("messages.orders.placedSuccess", { orderNumber: order.orderNumber, defaultValue: `Order #${order.orderNumber} placed successfully!` }));
        navigate(ROUTES.CHECKOUT_SUCCESS(order.id));
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      setStep(3);
      toast.error(err || t("messages.orders.placeFailed", "Failed to place order. Please review your details and try again."));
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Stepper Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  Step {step} of 3
                </span>
                <span className="text-xs text-slate-400 font-medium">{t("products.secureCheckoutNotice", "SSL Encrypted Checkout")}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {step === 1 && t("checkout.shippingTitle", "Shipping & Delivery")}
                {step === 2 && t("checkout.paymentTitle", "Payment Method")}
                {step === 3 && t("checkout.reviewTitle", "Review & Place Order")}
              </h1>
            </div>

            {/* Step Progress Chips */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
              {/* Step 1 Chip */}
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${step === 1
                    ? "bg-indigo-600 text-white shadow-sm"
                    : step > 1
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {step > 1 ? <Icon name="check" size={12} className="stroke-[3]" /> : "1"}
                <span className="hidden md:inline">{t("checkout.shippingTitle", "Shipping")}</span>
              </button>

              <div className={`w-3 h-0.5 rounded-full ${step > 1 ? "bg-emerald-500" : "bg-slate-200"}`} />

              {/* Step 2 Chip */}
              <button
                onClick={() => validateAddressStep() && setStep(2)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${step === 2
                    ? "bg-indigo-600 text-white shadow-sm"
                    : step > 2
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {step > 2 ? <Icon name="check" size={12} className="stroke-[3]" /> : "2"}
                <span className="hidden md:inline">{t("checkout.paymentTitle", "Payment")}</span>
              </button>

              <div className={`w-3 h-0.5 rounded-full ${step > 2 ? "bg-emerald-500" : "bg-slate-200"}`} />

              {/* Step 3 Chip */}
              <button
                onClick={() => validateAddressStep() && setStep(3)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${step === 3
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <span>3</span>
                <span className="hidden md:inline">{t("checkout.reviewOrder", "Review")}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Content (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: SHIPPING ADDRESS */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-xs">
                      <Icon name="map-pin" size={20} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        {t("checkout.deliveryDestination", "Delivery Destination")}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Select a saved address or enter new delivery details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Saved Address Cards */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      {t("checkout.savedAddresses", "Choose From Saved Addresses")}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleAddressSelect(addr.id)}
                            className={`cursor-pointer rounded-2xl p-4 border transition-all text-xs relative ${isSelected
                                ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5 font-bold text-slate-900">
                              <span className="text-sm">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 leading-relaxed line-clamp-2">
                              {addr.streetAddress}, {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                            <p className="text-slate-500 mt-2 font-medium flex items-center gap-1">
                              <Icon name="phone" size={12} className="text-slate-400" /> {addr.phone}
                            </p>
                          </div>
                        );
                      })}

                      <div
                        onClick={() => handleAddressSelect("new")}
                        className={`cursor-pointer rounded-2xl p-4 border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all min-h-[90px] ${selectedAddressId === "new"
                            ? "border-indigo-600 bg-indigo-50/40 text-indigo-700 ring-2 ring-indigo-500/20"
                            : "border-slate-300 hover:border-slate-400 text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <Icon name="plus" size={14} /> {t("checkout.customAddress", "Enter Custom Address")}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Form Inputs */}
                <form onSubmit={handleNextToPayment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t("checkout.fullName", "Full Name")}
                      required
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, fullName: e.target.value })
                      }
                      placeholder="e.g. Rahul Sharma"
                      size="sm"
                      leftIcon={<Icon name="user" size={14} className="text-slate-400" />}
                    />
                    <Input
                      label={t("checkout.phone", "Phone Number")}
                      required
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, phone: e.target.value })
                      }
                      placeholder="10-digit mobile number"
                      size="sm"
                      leftIcon={<Icon name="phone" size={14} className="text-slate-400" />}
                    />
                  </div>

                  <Textarea
                    label={t("checkout.streetAddress", "Street Address & Landmark")}
                    required
                    rows={2}
                    value={addressForm.streetAddress}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, streetAddress: e.target.value })
                    }
                    placeholder="Flat / House No., Building name, Street, Landmark"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label={t("checkout.city", "City")}
                      required
                      type="text"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                      placeholder="City"
                      size="sm"
                    />
                    <Input
                      label={t("checkout.state", "State")}
                      required
                      type="text"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, state: e.target.value })
                      }
                      placeholder="State"
                      size="sm"
                    />
                    <Input
                      label={t("checkout.postalCode", "PIN / Postal Code")}
                      required
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, postalCode: e.target.value })
                      }
                      placeholder="6-digit PIN"
                      size="sm"
                    />
                  </div>

                  {selectedAddressId === "new" && (
                    <div className="flex items-center gap-2.5 pt-2">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <label htmlFor="saveAddress" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        {t("checkout.saveAddress", "Save this address to my profile for future orders")}
                      </label>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
                    >
                      {t("checkout.continueToPayment", "Continue to Payment")} <Icon name="arrow-right" size={14} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: PAYMENT METHOD */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-xs">
                      <Icon name="credit-card" size={20} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        {t("checkout.paymentSelection", "Payment Selection")}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Select your preferred payment mode powered by Razorpay secure gateway.
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold">
                    <Icon name="shield" size={14} /> 256-Bit Encrypted
                  </div>
                </div>

                {/* Razorpay Trust Banner */}
                <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
                  <Icon name="shield" size={16} className="flex-shrink-0 mt-0.5 text-indigo-600" />
                  <div>
                    <strong className="text-indigo-950 font-bold">Razorpay Secure Checkout:</strong> Supports UPI (Google Pay, PhonePe, Paytm), Visa, MasterCard, RuPay cards, NetBanking from 50+ banks, and Digital Wallets.
                  </div>
                </div>

                {/* Payment Option Cards */}
                <div className="space-y-4 mb-6">
                  {/* 1. Razorpay All-in-One Checkout */}
                  <label
                    className={`block cursor-pointer rounded-2xl border p-5 transition-all ${paymentMethod === "RAZORPAY"
                        ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="RAZORPAY"
                        checked={paymentMethod === "RAZORPAY"}
                        onChange={() => setPaymentMethod("RAZORPAY")}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{t("checkout.razorpayTitle", "Razorpay All-in-One Checkout")}</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Recommended
                            </span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase self-start sm:self-auto">
                            Instant Confirmation
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Pay securely using any UPI app (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), Net Banking from 50+ banks, or Digital Wallets via Razorpay modal.
                        </p>

                        {/* Supported Badges */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                            ⚡ Google Pay
                          </span>
                          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                            🟣 PhonePe
                          </span>
                          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                            🔷 Paytm / UPI
                          </span>
                          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                            💳 Visa / MC / RuPay
                          </span>
                          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                            🏦 Net Banking
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* 2. Cash on Delivery */}
                  <label
                    className={`block cursor-pointer rounded-2xl border p-5 transition-all ${paymentMethod === "CASH_ON_DELIVERY"
                        ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH_ON_DELIVERY"
                        checked={paymentMethod === "CASH_ON_DELIVERY"}
                        onChange={() => {
                          setPaymentMethod("CASH_ON_DELIVERY");
                          setPendingOrderId(null);
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {t("checkout.codTitle", "Cash on Delivery (COD)")}
                          </span>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                            Pay upon arrival
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Pay via cash or courier scan-and-pay UPI upon receiving package.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs transition-all cursor-pointer"
                  >
                    <Icon name="arrow-left" size={14} /> {t("checkout.backToShipping", "Back to Shipping")}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextToReview}
                    className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
                  >
                    {t("checkout.reviewOrder", "Review Order")} <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ORDER REVIEW & PLACE ORDER */}
            {step === 3 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-xs">
                      <Icon name="check-circle" size={20} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        {t("checkout.finalReview", "Final Review & Order Confirmation")}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Verify your items and shipping details before completing order.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address & Payment Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Icon name="map-pin" size={14} className="text-indigo-600" /> {t("checkout.deliverTo", "Deliver To")}
                      </span>
                      <button
                        onClick={() => setStep(1)}
                        className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        {t("common.edit", "Change")}
                      </button>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{addressForm.fullName}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {addressForm.streetAddress}, {addressForm.city}, {addressForm.state} -{" "}
                      {addressForm.postalCode}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">📞 {addressForm.phone}</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Icon name="credit-card" size={14} className="text-indigo-600" /> {t("checkout.payment", "Payment")}
                      </span>
                      <button
                        onClick={() => setStep(2)}
                        className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        {t("common.edit", "Change")}
                      </button>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">
                      {paymentMethod === "RAZORPAY"
                        ? "Razorpay Secure Gateway"
                        : paymentMethod.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-indigo-600 font-bold mt-1 flex items-center gap-1">
                      <Icon name="shield" size={12} />
                      {paymentMethod === "CASH_ON_DELIVERY"
                        ? "Pay upon package delivery"
                        : "256-Bit SSL Razorpay Encrypted"}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {t("checkout.itemsInOrder", { count: items.length, defaultValue: `Items in this Order (${items.length})` })}
                  </h3>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => {
                      const itemImage =
                        item.variant?.images?.[0] ||
                        item.variant?.thumbnail ||
                        item.product?.thumbnail ||
                        item.product?.images?.[0];
                      return (
                        <div key={item.id} className="py-3 flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 shadow-xs">
                            {itemImage ? (
                              <img
                                src={getImageUrl(itemImage)}
                                alt={item.product?.name || "Product"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon name="shopping-bag" size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.product?.name}
                            </h4>
                            {item.variant?.attributes && (
                              <div className="mt-0.5">
                                <VariantBadge
                                  attributes={item.variant.attributes as Record<string, string>}
                                  sku={item.variant.sku}
                                  compact
                                />
                              </div>
                            )}
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Qty: <span className="font-bold text-slate-800">{item.quantity}</span> × {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="text-xs font-black text-slate-900">
                            {formatPrice(item.totalPrice)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Notes */}
                <Input
                  label={t("checkout.notes", "Delivery Instructions / Notes")}
                  optional
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("checkout.notesPlaceholder", "e.g. Please leave package with security desk if unavailable")}
                  size="sm"
                />

                {/* Place Order CTA Bar */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={actionLoading || isProcessingPayment}
                    className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Icon name="arrow-left" size={14} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={handlePlaceOrderSubmit}
                    disabled={actionLoading || isProcessingPayment}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-xl flex items-center gap-2 text-sm shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading || isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isProcessingPayment ? t("checkout.connectingRazorpay", "Connecting to Razorpay...") : t("checkout.processingOrder", "Processing Order...")}
                      </>
                    ) : (
                      <>
                        {paymentMethod === "CASH_ON_DELIVERY"
                          ? t("checkout.placeCodOrder", { price: formatPrice(summary.grandTotal), defaultValue: `Place COD Order (${formatPrice(summary.grandTotal)})` })
                          : t("checkout.payCompleteOrder", { price: formatPrice(summary.grandTotal), defaultValue: `Pay & Complete Order (${formatPrice(summary.grandTotal)})` })}{" "}
                        <Icon name="check-circle" size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Sticky Order Summary Sidebar (4 Columns) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 sticky top-24 space-y-5">
              <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>{t("cart.orderSummary", "Order Summary")}</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                  {items.length} {items.length === 1 ? t("common.items", "item") : t("common.items", "items")}
                </span>
              </h2>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{t("cart.subtotal", "Items Subtotal")}</span>
                  <span className="font-bold text-slate-900">
                    {formatPrice(summary.subtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100">
                    <span className="flex items-center gap-1.5">
                      <Icon name="tag" size={14} /> Coupon ({appliedCoupon.code})
                    </span>
                    <span>- {formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Icon name="truck" size={14} className="text-slate-400" /> {t("cart.shipping", "Delivery & Handling")}
                  </span>
                  {summary.shippingFee === 0 ? (
                    <span className="text-emerald-600 font-black uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                      {t("cart.free", "FREE")}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900">
                      {formatPrice(summary.shippingFee)}
                    </span>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-slate-900 block leading-tight">
                      {t("checkout.totalPayable", "Total Payable")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t("cart.estimatedTax", "Inclusive of applicable GST")}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-slate-900">
                    {formatPrice(summary.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Guarantees & Trust Badges */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Icon name="shield" size={15} className="text-indigo-600 flex-shrink-0" />
                  <span>{t("products.hassleFreeReturnNotice", "7-day hassle-free replacement guarantee")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="lock" size={15} className="text-emerald-600 flex-shrink-0" />
                  <span>{t("products.secureCheckoutNotice", "256-bit safe and secure encrypted checkout")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

