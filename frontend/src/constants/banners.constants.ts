import { BannerType } from "../types/banner";

export interface BannerGradientPreset {
  id: string;
  name: string;
  value: string;
  preview: string;
}

export const BANNER_GRADIENT_PRESETS: BannerGradientPreset[] = [
  {
    id: "soft-indigo-slate",
    name: "Soft Indigo & Slate",
    value: "from-indigo-600 via-indigo-500 to-slate-600",
    preview: "bg-gradient-to-r from-indigo-600 via-indigo-500 to-slate-600",
  },
  {
    id: "botanical-emerald-mint",
    name: "Botanical Emerald & Mint",
    value: "from-emerald-600 via-teal-500 to-slate-600",
    preview: "bg-gradient-to-r from-emerald-600 via-teal-500 to-slate-600",
  },
  {
    id: "pastel-rose-blush",
    name: "Pastel Rose & Blush",
    value: "from-rose-500 via-pink-400 to-indigo-500",
    preview: "bg-gradient-to-r from-rose-500 via-pink-400 to-indigo-500",
  },
  {
    id: "warm-amber-peach",
    name: "Warm Amber & Peach",
    value: "from-amber-500 via-orange-400 to-rose-400",
    preview: "bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400",
  },
  {
    id: "sky-blue-lavender",
    name: "Sky Blue & Lavender",
    value: "from-sky-500 via-indigo-400 to-purple-500",
    preview: "bg-gradient-to-r from-sky-500 via-indigo-400 to-purple-500",
  },
  {
    id: "clean-slate-minimal",
    name: "Clean Slate Minimal",
    value: "from-slate-600 via-slate-500 to-indigo-600",
    preview: "bg-gradient-to-r from-slate-600 via-slate-500 to-indigo-600",
  },
];

export const BANNER_TYPES: { label: string; value: BannerType; desc: string }[] = [
  { label: "Festival", value: "FESTIVAL", desc: "Diwali, Eid, Christmas, New Year" },
  { label: "Seasonal", value: "SEASONAL", desc: "Spring, Summer, Monsoon, Winter drops" },
  { label: "Flash Sale", value: "SALE", desc: "Limited time discounts & 48h sales" },
  { label: "Promotional", value: "PROMOTIONAL", desc: "Brand partnerships & deals" },
  { label: "General", value: "GENERAL", desc: "Standard evergreen storefront banner" },
];

export const BANNER_DEFAULT_VALUES = {
  TITLE: "",
  SUBTITLE: "",
  DESCRIPTION: "",
  TYPE: "FESTIVAL" as BannerType,
  BADGE_TEXT: "Festival Special",
  BUTTON_TEXT: "Explore Deals",
  LINK: "/deals",
  IMAGE: "",
  BG_GRADIENT: BANNER_GRADIENT_PRESETS[0].value,
  PRIORITY: 10,
  IS_ACTIVE: true,
  CAROUSEL_AUTOPLAY_INTERVAL: 6000,
};
