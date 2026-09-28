import React from "react";
import { Link } from "react-router-dom";
import { Banner } from "../../types/banner";
import { BANNER_DEFAULT_VALUES } from "../../constants/banners.constants";
import { getImageUrl } from "../../utils/image.utils";
import { getBannerRemainingTime } from "../../utils/banner.utils";
import { BannerTypeBadge } from "../common/Badge";
import { Carousel, CarouselControls } from "../common/Carousel";
import { Icon } from "../common/Icon";

interface DynamicHeroBannerProps {
  banners: Banner[];
  loading?: boolean;
}

export const DynamicHeroBanner: React.FC<DynamicHeroBannerProps> = ({
  banners,
  loading = false,
}) => {
  // Active banner list
  const activeList = banners.filter((b) => b.isActive);

  // 1. Loading Skeleton State (Compact & Clean)
  if (loading) {
    return (
      <section className="relative overflow-hidden bg-slate-900/5 py-8 sm:py-12 border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3.5 text-center lg:text-left">
              <div className="h-5 w-36 bg-slate-200 rounded-full mx-auto lg:mx-0 animate-pulse" />
              <div className="h-9 sm:h-12 w-3/4 bg-slate-200 rounded-xl mx-auto lg:mx-0 animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-200 rounded-lg mx-auto lg:mx-0 animate-pulse" />
              <div className="h-9 w-32 bg-slate-200 rounded-xl mx-auto lg:mx-0 animate-pulse mt-4" />
            </div>
            <div className="hidden lg:block lg:col-span-4">
              <div className="h-44 w-full bg-slate-200 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Default Curated Hero Fallback (Compact, clean, visually balanced)
  if (activeList.length === 0) {
    return (
      <section className="relative overflow-hidden py-8 sm:py-12 lg:py-14 border-b border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[260px] bg-gradient-to-b from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200/90 text-slate-700 text-xs font-medium shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">New Season Essentials</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-semibold">Free Delivery Above ₹499</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
              Discover Curated Goods,{" "}
              <span className="text-indigo-600">Engineered for Living</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Shop verified premium products, enjoy transparent pricing, and experience seamless direct checkout with fast delivery.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-indigo-600 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Shop All Products</span>
                <Icon name="arrow-right" className="w-4 h-4" />
              </Link>
              <Link
                to="/categories"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-all"
              >
                Explore Categories
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 3. Dynamic Database-Driven Hero Banner (Optimized height, compact spacing, responsive alignment)
  return (
    <Carousel<Banner>
      items={activeList}
      autoPlayInterval={BANNER_DEFAULT_VALUES.CAROUSEL_AUTOPLAY_INTERVAL}
      pauseOnHover={true}
      renderItem={(currentBanner, _index, controls) => {
        const gradientClass =
          currentBanner.bgGradient || "from-indigo-600 via-indigo-500 to-slate-600";
        const timeLeftText = getBannerRemainingTime(currentBanner.endDate);
        const hasImage = Boolean(currentBanner.image);

        return (
          <section className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800/80 transition-colors duration-500 select-none">
            {/* Background Ambient Gradient Layer */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${gradientClass} opacity-95 transition-all duration-500`}
            />

            {/* Subtle Background Backdrop Blend (when image is present) */}
            {hasImage && (
              <>
                <img
                  src={getImageUrl(currentBanner.image!)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25 filter blur-[2px] transform scale-105 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
              </>
            )}

            {/* Decorative Ambient Glow Highlights */}
            <div className="absolute -top-16 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* Left Side: Headline & CTAs */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-3.5 text-center lg:text-left">
                  {/* Badge & Countdown Indicator */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                    <BannerTypeBadge
                      type={currentBanner.type}
                      badgeText={currentBanner.badgeText}
                      size="sm"
                    />

                    {timeLeftText && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/25 border border-rose-400/30 text-rose-200 backdrop-blur-md">
                        <Icon name="clock" className="w-3 h-3 text-rose-300 animate-pulse" />
                        <span>Ends in {timeLeftText}</span>
                      </span>
                    )}
                  </div>

                  {/* Headlines */}
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.12] drop-shadow-md">
                      {currentBanner.title}
                    </h1>

                    {currentBanner.subtitle && (
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-amber-200 drop-shadow-xs">
                        {currentBanner.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Concise Description */}
                  {currentBanner.description && (
                    <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-xl mx-auto lg:mx-0 line-clamp-2">
                      {currentBanner.description}
                    </p>
                  )}

                  {/* Compact Action Buttons */}
                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5">
                    <Link
                      to={currentBanner.link || "/products"}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md hover:shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>{currentBanner.buttonText || "Shop Now"}</span>
                      <Icon name="arrow-right" className="w-3.5 h-3.5 text-slate-900" />
                    </Link>

                    <Link
                      to="/deals"
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
                    >
                      <Icon name="zap" className="w-3.5 h-3.5 text-amber-300" />
                      <span>Flash Deals</span>
                    </Link>
                  </div>
                </div>

                {/* Right Side: Featured Visual Showcase Card */}
                <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
                  {hasImage ? (
                    <div className="relative rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl p-3 shadow-xl overflow-hidden group">
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900/60">
                        <img
                          src={getImageUrl(currentBanner.image!)}
                          alt={currentBanner.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                          Featured
                        </div>
                      </div>

                      {/* Micro Quick Trust Strip */}
                      <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold text-slate-200">
                        <div className="py-1 px-1 rounded-lg bg-white/5 border border-white/10">
                          <span className="block text-white font-bold">⚡ Fast</span>
                          <span>Delivery</span>
                        </div>
                        <div className="py-1 px-1 rounded-lg bg-white/5 border border-white/10">
                          <span className="block text-white font-bold">🛡️ Genuine</span>
                          <span>Products</span>
                        </div>
                        <div className="py-1 px-1 rounded-lg bg-white/5 border border-white/10">
                          <span className="block text-white font-bold">🔄 7-Day</span>
                          <span>Returns</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                          {currentBanner.type}
                        </span>
                        <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Campaign
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-white">
                          Curated Direct Deals
                        </h3>
                        <p className="text-[11px] text-slate-200 mt-1 leading-relaxed line-clamp-2">
                          Direct authentic guarantees, instant online payment checkout, and free express delivery on orders over ₹499.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/15 grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold text-slate-200">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="block text-white font-bold">⚡ Fast</span>
                          <span>Shipping</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="block text-white font-bold">🛡️ 100%</span>
                          <span>Authentic</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="block text-white font-bold">🔄 Easy</span>
                          <span>Returns</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Carousel Controls */}
              <CarouselControls
                totalSlides={controls.totalSlides}
                currentIndex={controls.currentIndex}
                onSelectSlide={controls.goTo}
                onPrev={controls.prev}
                onNext={controls.next}
                className="!mt-4 !pt-3"
              />
            </div>
          </section>
        );
      }}
    />
  );
};

export default DynamicHeroBanner;
