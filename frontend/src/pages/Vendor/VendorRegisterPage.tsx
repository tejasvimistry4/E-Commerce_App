import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerVendorApi } from "../../api/auth.api";
import { Button, Input } from "../../components/common";
import { toast } from "react-toastify";

export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessPhone: "",
    businessAddress: "",
    businessDescription: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Please fill in your name, email, and password.");
      return;
    }

    if (!form.businessName.trim() || !form.businessPhone.trim()) {
      toast.error("Please provide your Business/Store Name and Phone Number.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await registerVendorApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        businessName: form.businessName.trim(),
        businessPhone: form.businessPhone.trim(),
        businessAddress: form.businessAddress.trim() || undefined,
        businessDescription: form.businessDescription.trim() || undefined,
      });

      setRegisteredEmail(form.email.trim());
      setIsSubmitted(true);
      toast.success("Vendor application submitted successfully!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // If application was submitted, display reassuring pending approval state
  if (isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-lg bg-white border border-emerald-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-emerald-500/5 text-center relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xs text-2xl">
            ⏳
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
            Pending Super Admin Review
          </span>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-4">
            Application Submitted!
          </h1>

          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Thank you for applying to become a Vendor Partner. Your application for{" "}
            <span className="font-bold text-slate-900">{form.businessName}</span> has been received and registered under{" "}
            <span className="font-mono text-slate-800 font-semibold">{registeredEmail}</span>.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2 my-6">
            <div className="flex items-start space-x-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Your merchant account is securely created with the <strong>Vendor</strong> role.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-amber-600 font-bold">⏳</span>
              <span>Accounts remain pending until approved by the Super Admin team.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-indigo-600 font-bold">🚀</span>
              <span>Once activated, you can log in directly to configure your store and publish products.</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate("/login")}
            >
              Go to Sign In
            </Button>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => navigate("/")}
            >
              Return to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/60 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Vendor Partner Program
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2">
            Register Your Store
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Expand your business and reach thousands of customers by selling on our premier marketplace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business Profile */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 pb-2 border-b border-slate-100">
              1. Business & Store Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store / Business Name"
                name="businessName"
                required
                value={form.businessName}
                onChange={handleChange}
                placeholder="e.g., Apex Tech Supplies"
                size="md"
              />
              <Input
                label="Business Phone Number"
                name="businessPhone"
                required
                value={form.businessPhone}
                onChange={handleChange}
                placeholder="e.g., +91 98765 43210"
                size="md"
              />
            </div>

            <Input
              label="Business Address (Optional)"
              name="businessAddress"
              value={form.businessAddress}
              onChange={handleChange}
              placeholder="Store street, city, state, postal code"
              size="md"
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Store Description / Brand Story (Optional)
              </label>
              <textarea
                name="businessDescription"
                value={form.businessDescription}
                onChange={handleChange}
                rows={2}
                placeholder="Tell us briefly about the products and categories you specialize in..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Section 2: Account Credentials */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 pb-2 border-b border-slate-100">
              2. Account Credentials & Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Authorized Contact Person"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Jane Smith"
                size="md"
              />
              <Input
                label="Official Email Address"
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="merchant@example.com"
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                size="md"
                showPasswordToggle
              />
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                size="md"
                showPasswordToggle
              />
            </div>
          </div>



          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            loadingText="Submitting application..."
            fullWidth
            className="py-3.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
          >
            Submit Vendor Application
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Already registered as a vendor?{" "}
          <Link
            to="/login"
            className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Sign In to Vendor Portal
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VendorRegisterPage;
