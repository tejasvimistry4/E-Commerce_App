import React, { useState } from "react";
import { Product } from "../../types/product";
import { useWishlist } from "../../hooks/useWishlist";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "danger-solid"
  | "ghost"
  | "success"
  | "warning"
  | "dark"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "icon";

export type ButtonRounded = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full" | "none";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: ButtonRounded;
  children?: React.ReactNode;

  // Reusable Wishlist Action Integration
  wishlistProduct?: Product;
  wishlistVariant?: "floating" | "button" | "icon";
  showWishlistLabel?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  isLoading = false,
  loadingText,
  icon,
  rightIcon,
  fullWidth = false,
  rounded,
  children,
  className = "",
  disabled,
  type = "button",
  wishlistProduct,
  wishlistVariant = "floating",
  showWishlistLabel = false,
  onClick,
  ...props
}) => {
  const { isInWishlist, toggleItem } = useWishlist();
  const wishlisted = wishlistProduct ? isInWishlist(wishlistProduct.id) : false;
  const [isWishlistAnimating, setIsWishlistAnimating] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const handleWishlistClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    }

    if (isWishlistLoading || !wishlistProduct) return;

    setIsWishlistLoading(true);
    setIsWishlistAnimating(true);

    try {
      await toggleItem(wishlistProduct);
    } finally {
      setIsWishlistLoading(false);
      setTimeout(() => setIsWishlistAnimating(false), 400);
    }
  };

  // 1. If used as a Wishlist Action button
  if (wishlistProduct) {
    const isBusy = isWishlistLoading || loading || isLoading;

    const wishlistIconSizeClasses = {
      xs: "w-3 h-3",
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4",
      lg: "w-5 h-5",
      xl: "w-6 h-6",
      icon: "w-4 h-4",
    }[size] || "w-4 h-4";

    if (wishlistVariant === "button") {
      return (
        <button
          type={type}
          onClick={handleWishlistClick}
          disabled={disabled || isBusy}
          className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer shadow-xs border ${
            wishlisted
              ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300 shadow-rose-500/10"
              : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300"
          } ${isWishlistAnimating ? "scale-95" : "hover:scale-[1.02]"} active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          {...props}
        >
          <svg
            className={`${wishlistIconSizeClasses} transition-all duration-300 ${
              wishlisted
                ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-xs"
                : "fill-transparent text-slate-500 stroke-current"
            } ${isWishlistAnimating ? "scale-125" : ""}`}
            viewBox="0 0 24 24"
            strokeWidth={wishlisted ? 0 : 2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          {(showWishlistLabel || children) && (
            <span className="font-bold">
              {children || (wishlisted ? "In Wishlist" : "Add to Wishlist")}
            </span>
          )}
        </button>
      );
    }

    // Floating round variant (default for product cards)
    return (
      <button
        type={type}
        onClick={handleWishlistClick}
        disabled={disabled || isBusy}
        className={`relative p-2 sm:p-2.5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-md shadow-md hover:shadow-lg ${
          wishlisted
            ? "bg-rose-500/90 hover:bg-rose-600 text-white shadow-rose-500/30 scale-105"
            : "bg-white/90 hover:bg-white text-slate-600 hover:text-rose-500 shadow-slate-900/10 hover:scale-110"
        } active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        aria-label={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        {...props}
      >
        <svg
          className={`${wishlistIconSizeClasses} transition-transform duration-300 ${
            wishlisted
              ? "fill-white text-white scale-105"
              : "fill-transparent text-current stroke-current"
          } ${isWishlistAnimating ? "scale-125" : ""}`}
          viewBox="0 0 24 24"
          strokeWidth={wishlisted ? 0 : 2.2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>
    );
  }

  // 2. Standard Button rendering
  const isBusy = loading || isLoading;

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs active:scale-[0.98]",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 active:scale-[0.98]",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 active:scale-[0.98] shadow-2xs",
    danger:
      "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-[0.98]",
    "danger-solid":
      "bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]",
    warning:
      "bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-[0.98]",
    dark:
      "bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-[0.98]",
    link:
      "bg-transparent text-indigo-600 hover:text-indigo-700 hover:underline p-0 h-auto font-bold shadow-none",
  };

  const defaultSizeStyles: Record<ButtonSize, string> = {
    xs: "px-2.5 py-1 text-[11px] rounded-lg gap-1",
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2.5 text-xs rounded-xl gap-2",
    lg: "px-6 py-3.5 text-sm rounded-2xl gap-2.5",
    xl: "px-8 py-4 text-base rounded-2xl gap-3",
    icon: "p-2 rounded-xl",
  };

  const roundedStyles: Record<ButtonRounded, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  };

  const customRoundedClass = rounded ? roundedStyles[rounded] : "";
  const sizeClass = defaultSizeStyles[size];
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      disabled={disabled || isBusy}
      className={`inline-flex items-center justify-center font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeClass} ${customRoundedClass} ${widthClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {isBusy ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText ? <span>{loadingText}</span> : children ? <span>{children}</span> : null}
        </>
      ) : (
        <>
          {icon ? <span className="flex-shrink-0">{icon}</span> : null}
          {children ? <span>{children}</span> : null}
          {rightIcon ? <span className="flex-shrink-0">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
};

export default Button;
