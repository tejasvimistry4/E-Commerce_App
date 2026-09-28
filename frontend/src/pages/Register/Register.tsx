import React, { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { registerUser, googleLoginUser, clearAuthError } from "../../redux/auth/authSlice";
import { syncGuestCartWithServer } from "../../redux/cart/cartSlice";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { Button, Input } from "../../components/common";

const Register: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user) {
      if (user.role === "SUPER_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error(t("messages.auth.registerRequiredFields", { defaultValue: "Please fill in all required fields." }));
      return;
    }

    if (form.password.length < 6) {
      toast.error(t("messages.auth.passwordMinLength", { defaultValue: "Password must be at least 6 characters long." }));
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error(t("messages.auth.passwordMismatch", { defaultValue: "Passwords do not match." }));
      return;
    }

    try {
      const result = await dispatch(
        registerUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      ).unwrap();

      // Automatically sync any items saved during guest browsing
      await dispatch(syncGuestCartWithServer()).unwrap().catch(() => {});

      toast.success(t("messages.auth.registerSuccess", { name: result.user.name, defaultValue: `Welcome to E-Commerce, ${result.user.name}!` }));
      if (result.user.role === "SUPER_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(String(err || t("messages.auth.registerFailed", { defaultValue: "Registration failed" })));
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      const result = await dispatch(googleLoginUser({ idToken })).unwrap();
      await dispatch(syncGuestCartWithServer()).unwrap().catch(() => {});
      toast.success(t("messages.auth.registerSuccess", { name: result.user.name, defaultValue: `Welcome to E-Commerce, ${result.user.name}!` }));

      if (result.user.role === "SUPER_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(String(err || "Google Sign-Up failed. Please try again."));
    }
  };

  const handleGoogleError = (errorMsg: string) => {
    toast.error(errorMsg);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs mb-4">
            <svg
              className="w-7 h-7 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {t("auth.createAccount", { defaultValue: "Create an account" })}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {t("auth.joinEcommerce", { defaultValue: "Join E-Commerce for premier shopping experiences" })}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-3">
            <svg
              className="w-5 h-5 flex-shrink-0 text-rose-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("auth.fullName", { defaultValue: "Full Name" })}
            labelClassName="uppercase tracking-wider"
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder={t("auth.namePlaceholder", { defaultValue: "John Doe" })}
            size="lg"
            leftIcon={
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          />

          <Input
            label={t("auth.emailAddress", { defaultValue: "Email Address" })}
            labelClassName="uppercase tracking-wider"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder={t("auth.emailPlaceholder", { defaultValue: "name@example.com" })}
            size="lg"
            leftIcon={
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <Input
            label={t("auth.password", { defaultValue: "Password" })}
            labelClassName="uppercase tracking-wider"
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder={t("auth.passwordPlaceholder", { defaultValue: "Min 6 characters" })}
            size="lg"
            showPasswordToggle
            leftIcon={
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          />

          <Input
            label={t("auth.confirmPassword", { defaultValue: "Confirm Password" })}
            labelClassName="uppercase tracking-wider"
            type="password"
            name="confirmPassword"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder={t("auth.confirmPassword", { defaultValue: "Re-enter password" })}
            size="lg"
            showPasswordToggle
            leftIcon={
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
          />

          {/* Side-by-side action buttons: Create Account with Email & Sign up with Google */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              loadingText={t("auth.creatingAccount", { defaultValue: "Creating..." })}
              fullWidth
              className="py-3.5"
            >
              {t("auth.createAccount", { defaultValue: "Create Account" })}
            </Button>

            <div className="w-full">
              <GoogleAuthButton
                mode="signup"
                label={t("auth.signUpWithGoogle", { defaultValue: "Sign Up with Google" })}
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading}
              />
            </div>
          </div>
        </form>

        {/* Footer info */}
        <p className="mt-8 text-center text-sm text-slate-500">
          {t("auth.alreadyHaveAccount", { defaultValue: "Already have an account?" })}{" "}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t("auth.logIn", { defaultValue: "Sign in" })}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;