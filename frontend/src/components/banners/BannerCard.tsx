import React from "react";
import { Banner } from "../../types/banner";
import { getImageUrl } from "../../utils/image.utils";
import { BannerStatusBadge, BannerTypeBadge } from "../common/Badge";
import { formatBannerScheduleRange } from "../../utils/banner.utils";
import { Icon } from "../common/Icon";

interface BannerCardProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onToggleStatus: (banner: Banner) => void;
}

export const BannerCard: React.FC<BannerCardProps> = ({
  banner,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const gradientClass = banner.bgGradient || "from-indigo-600 via-indigo-500 to-slate-600";

  return (
    <div className="rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Banner Mini Preview Header */}
      <div className={`p-6 bg-gradient-to-r ${gradientClass} text-white relative overflow-hidden`}>
        {banner.image && (
          <img
            src={getImageUrl(banner.image)}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
          />
        )}

        <div className="relative z-10 flex items-start justify-between gap-4 mb-3">
          <BannerTypeBadge
            type={banner.type}
            badgeText={banner.badgeText}
            size="sm"
          />

          <BannerStatusBadge banner={banner} size="sm" />
        </div>

        <div className="relative z-10 space-y-1">
          <h3 className="text-xl font-black leading-snug drop-shadow-sm line-clamp-1">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="text-xs font-semibold text-white/85 line-clamp-1">
              {banner.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Banner Body Info */}
      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {banner.description || "No description specified for this promotional campaign."}
        </p>

        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-400">Destination CTA:</span>
            <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
              <span>{banner.buttonText || "Shop Now"}</span>
              <span className="text-slate-400">({banner.link || "/products"})</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-400">Priority Weight:</span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Level {banner.priority}
            </span>
          </div>

          {(banner.startDate || banner.endDate) && (
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-400">
                <Icon name="calendar" className="w-3.5 h-3.5" />
                <span>Schedule:</span>
              </span>
              <span className="font-medium text-slate-700">
                {formatBannerScheduleRange(banner.startDate, banner.endDate)}
              </span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(banner)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${banner.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
          >
            {banner.isActive ? (
              <>
                <Icon name="eye" className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active</span>
              </>
            ) : (
              <>
                <Icon name="eye-off" className="w-3.5 h-3.5 text-slate-400" />
                <span>Disabled</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onEdit(banner)}
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
              title="Edit Banner"
            >
              <Icon name="edit" className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(banner)}
              className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
              title="Delete Banner"
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerCard;
