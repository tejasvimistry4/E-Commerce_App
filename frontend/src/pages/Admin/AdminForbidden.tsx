import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/redux";
import { useTranslation } from "react-i18next";

export const AdminForbidden: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xs">
          🛡️
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-4">
          <span>{t("admin.forbiddenTitle", { defaultValue: "403 Access Forbidden" })}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
          {t("admin.forbiddenPrivilegesRequired", { defaultValue: "Administrator Privileges Required" })}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {t("admin.forbiddenSignedAs", { defaultValue: "You are currently signed in as" })}{" "}
          <strong className="text-slate-900">{user?.email}</strong> {t("admin.withRole", { defaultValue: "with role" })}{" "}
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
            {user?.role || "USER"}
          </span>
          . {t("admin.forbiddenDesc", { defaultValue: "The Admin Console is strictly reserved for administrative accounts." })}
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-8 text-left">
          <p className="text-xs text-slate-700 font-bold mb-1">
            {t("admin.needAdminAccess", { defaultValue: "Need Admin Access?" })}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t("admin.needAdminAccessDesc", { defaultValue: "Please log in with an administrator account or return to the shopper catalog." })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs"
          >
            ← {t("admin.returnToStorefront", { defaultValue: "Return to Storefront" })}
          </Link>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 bg-white border border-slate-200 transition-all shadow-2xs cursor-pointer"
          >
            {t("admin.switchAccount", { defaultValue: "Switch Account" })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminForbidden;
