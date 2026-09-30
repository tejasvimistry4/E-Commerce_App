import React, { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { loginUser, googleLoginUser, clearAuthError } from "../../redux/auth/authSlice";
import { syncGuestCartWithServer } from "../../redux/cart/cartSlice";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { Button, Input } from "../../components/common";

const Login: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Read query params for redirect
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user) {
      const targetPath =
        redirectParam && (user.role === "SUPER_ADMIN" || !redirectParam.startsWith("/admin"))
          ? redirectParam
          : user.role === "SUPER_ADMIN"
          ? "/admin"
          : user.role === "VENDOR"
          ? "/vendor"
          : "/";
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, dispatch, redirectParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error(t("messages.auth.loginRequiredFields", { defaultValue: "Please fill in both email and password." }));
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          email: form.email.trim(),
          password: form.password,
        })
      ).unwrap();

      // Automatically sync any items saved during guest browsing
      await dispatch(syncGuestCartWithServer()).unwrap().catch(() => {});

      toast.success(t("messages.auth.loginSuccess", { name: result.user.name, defaultValue: `Welcome back, ${result.user.name}!` }));
      
      // Automatic role-based redirect
      const targetPath =
        redirectParam && (result.user.role === "SUPER_ADMIN" || !redirectParam.startsWith("/admin"))
          ? redirectParam
          : result.user.role === "SUPER_ADMIN"
          ? "/admin"
          : result.user.role === "VENDOR"
          ? "/vendor"
          : "/";
      
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      toast.error(String(err || t("messages.auth.loginFailed", { defaultValue: "Login failed" })));
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      const result = await dispatch(googleLoginUser({ idToken })).unwrap();
      await dispatch(syncGuestCartWithServer()).unwrap().catch(() => {});
      toast.success(t("messages.auth.loginSuccess", { name: result.user.name, defaultValue: `Welcome back, ${result.user.name}!` }));

      const targetPath =
        redirectParam && (result.user.role === "SUPER_ADMIN" || !redirectParam.startsWith("/admin"))
          ? redirectParam
          : result.user.role === "SUPER_ADMIN"
          ? "/admin"
          : result.user.role === "VENDOR"
          ? "/vendor"
          : "/";

      navigate(targetPath, { replace: true });
    } catch (err: any) {
      toast.error(String(err || "Google Sign-In failed. Please try again."));
    }
  };

  const handleGoogleError = (errorMsg: string) => {
    toast.error(errorMsg);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Ambient gradient backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-200/25 rounded-full blur-3xl pointer-events-none" />

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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {t("auth.welcomeBack", { defaultValue: "Welcome back" })}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {t("auth.enterCredentials", { defaultValue: "Enter your credentials to access your account" })}
          </p>
        </div>

        {/* Global Error Banner if any */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
            labelRight={
              <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors">
                {t("auth.forgotPassword", { defaultValue: "Forgot password?" })}
              </span>
            }
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder={t("auth.passwordPlaceholder", { defaultValue: "••••••••" })}
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

          {/* Side-by-side action buttons: Sign In with Email & Continue with Google */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              loadingText={t("auth.signingIn", { defaultValue: "Signing in..." })}
              fullWidth
              className="py-3.5"
            >
              {t("auth.signInWithEmail", { defaultValue: "Sign In with Email" })}
            </Button>

            <div className="w-full">
              <GoogleAuthButton
                mode="signin"
                label={t("auth.signInWithGoogle", { defaultValue: "Sign In with Google" })}
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading}
              />
            </div>
          </div>
        </form>

        {/* Footer info */}
        <p className="mt-8 text-center text-sm text-slate-500">
          {t("auth.dontHaveAccount", { defaultValue: "Don't have an account?" })}{" "}
          <Link
            to="/register"
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t("auth.register", { defaultValue: "Create account" })}
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Want to sell on our marketplace?{" "}
            <Link
              to="/vendor/register"
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors"
            >
              Apply as a Vendor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
