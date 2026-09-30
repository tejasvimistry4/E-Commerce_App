import React from "react";
import { Link } from "react-router-dom";
import { useTranslation, LanguageSelector } from "../../i18n";
import { Icon } from "../common/Icon";

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.products"), href: "/products" },
    { label: t("nav.categories"), href: "/categories" },
    { label: t("nav.deals"), href: "/deals" },
    { label: t("nav.myOrders"), href: "/orders" },
    { label: t("nav.cart"), href: "/cart" },
  ];

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200/90 font-sans relative z-20 shadow-2xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">

          {/* 1. Brand Logo & Name */}
          <Link
            to="/"
            className="flex items-center space-x-3 group cursor-pointer flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Icon name="shopping-bag" className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              {t("nav.brand")}<span className="text-indigo-600">.</span>
            </span>
          </Link>

          {/* 2. Navigation Link Pills */}
          <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 text-xs font-semibold text-slate-600">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.href}
                className="px-3 py-1.5 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 3. Contact Details & Language Switcher */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 text-xs text-slate-500">
            {/* Language Selector */}
            <LanguageSelector variant="compact" direction="up" />

            {/* Location Pill */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
              <Icon name="map-pin" className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span className="text-slate-700 font-medium">{t("footer.location")}</span>
            </div>

            {/* Phone Pill */}
            <a
              href="tel:+18005550199"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:text-slate-900 transition-all shadow-2xs group"
            >
              <Icon name="phone" className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-slate-700 font-medium">{t("footer.phone")}</span>
            </a>

            {/* Email Pill */}
            <a
              href="mailto:support@ecommerce.com"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:text-slate-900 transition-all shadow-2xs group"
            >
              <Icon name="mail" className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-slate-700 font-medium">{t("footer.email")}</span>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;

