import React from "react";
import { BannerType } from "../../types/banner";
import { getImageUrl } from "../../utils/image.utils";
import { BannerTypeBadge } from "../common/Badge";

interface BannerLivePreviewProps {
  title: string;
  subtitle?: string;
  type: BannerType;
  badgeText?: string;
  buttonText?: string;
  image?: string;
  bgGradient?: string;
  className?: string;
}

export const BannerLivePreview: React.FC<BannerLivePreviewProps> = ({
  title,
  subtitle,
  type,
  badgeText,
  buttonText = "Shop Now",
  image,
  bgGradient = "from-indigo-600 via-indigo-500 to-slate-600",
  className = "",
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-r ${bgGradient} text-white shadow-md relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {image && (
        <img
          src={getImageUrl(image)}
          alt="preview"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
      )}
      <div className="relative z-10 space-y-2">
        <BannerTypeBadge
          type={type}
          badgeText={badgeText || `${type} SPOTLIGHT`}
          size="sm"
        />
        <h3 className="text-xl font-black leading-tight">
          {title || "Your Banner Headline Here"}
        </h3>
        {subtitle && (
          <p className="text-xs font-semibold text-amber-200">{subtitle}</p>
        )}
        <div className="pt-2 flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold shadow-xs">
            {buttonText || "Shop Now"} →
          </span>
        </div>
      </div>
    </div>
  );
};

export default BannerLivePreview;
