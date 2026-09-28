import React, { forwardRef } from "react";

export type SelectSize = "xs" | "sm" | "md" | "lg";
export type SelectVariant = "default" | "filled" | "outline" | "flush" | "ghost";

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options?: SelectOption[];
  label?: React.ReactNode;
  labelRight?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string | boolean;
  helperText?: React.ReactNode;
  size?: SelectSize;
  variant?: SelectVariant;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  hideChevron?: boolean;
  customChevron?: React.ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  isLoading?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      children,
      label,
      labelRight,
      required = false,
      optional = false,
      error,
      helperText,
      size = "md",
      variant = "default",
      leftIcon,
      icon,
      hideChevron = false,
      customChevron,
      fullWidth = false,
      containerClassName = "",
      labelClassName = "",
      selectClassName = "",
      className = "",
      id,
      name,
      disabled = false,
      isLoading = false,
      ...props
    },
    ref
  ) => {
    const selectId = id || (name ? `select-${name}` : undefined);
    const effectiveLeftIcon = leftIcon || icon;
    const isEffectivelyDisabled = disabled || isLoading;

    // Size tokens matching Input component proportions & typography
    const sizeStyles: Record<
      SelectSize,
      {
        py: string;
        pl: string;
        plWithIcon: string;
        pr: string;
        prNoChevron: string;
        fontSize: string;
        rounded: string;
        icon: string;
        chevron: string;
        chevronRight: string;
      }
    > = {
      xs: {
        py: "py-1",
        pl: "pl-2.5",
        plWithIcon: "pl-7",
        pr: "pr-6",
        prNoChevron: "pr-2.5",
        fontSize: "text-[11px] font-medium leading-tight",
        rounded: "rounded-lg",
        icon: "w-3 h-3 left-2",
        chevron: "w-3 h-3",
        chevronRight: "right-2",
      },
      sm: {
        py: "py-2",
        pl: "pl-3",
        plWithIcon: "pl-8",
        pr: "pr-7",
        prNoChevron: "pr-3",
        fontSize: "text-xs font-medium leading-normal",
        rounded: "rounded-xl",
        icon: "w-3.5 h-3.5 left-2.5",
        chevron: "w-3.5 h-3.5",
        chevronRight: "right-2.5",
      },
      md: {
        py: "py-2",
        pl: "pl-3",
        plWithIcon: "pl-8",
        pr: "pr-7",
        prNoChevron: "pr-3",
        fontSize: "text-xs font-medium leading-normal",
        rounded: "rounded-xl",
        icon: "w-3.5 h-3.5 left-2.5",
        chevron: "w-3.5 h-3.5",
        chevronRight: "right-2.5",
      },
      lg: {
        py: "py-2.5",
        pl: "pl-3.5",
        plWithIcon: "pl-9",
        pr: "pr-8",
        prNoChevron: "pr-3.5",
        fontSize: "text-xs sm:text-sm font-medium leading-normal",
        rounded: "rounded-xl",
        icon: "w-4 h-4 left-3",
        chevron: "w-4 h-4",
        chevronRight: "right-3",
      },
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;

    const variantStyles: Record<SelectVariant, string> = {
      default:
        "bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15",
      filled:
        "bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15",
      outline:
        "bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs",
      flush:
        "bg-transparent border-b border-t-0 border-x-0 rounded-none px-0 border-slate-200 focus:border-indigo-500 focus:ring-0",
      ghost:
        "bg-transparent border-transparent hover:bg-slate-100/70 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15",
    };

    // Error styles
    const errorStyles = error
      ? "!border-rose-300 !bg-rose-50/50 focus:!border-rose-400 focus:!ring-rose-500/15 text-rose-900"
      : "";

    // Padding calculations
    const paddingLeftClass =
      variant === "flush"
        ? "pl-0"
        : effectiveLeftIcon
        ? currentSize.plWithIcon
        : currentSize.pl;

    const paddingRightClass =
      variant === "flush"
        ? "pr-0"
        : hideChevron
        ? currentSize.prNoChevron
        : currentSize.pr;

    const widthClass = fullWidth || label ? "w-full" : "w-auto";

    return (
      <div className={`${widthClass} ${containerClassName}`}>
        {/* Label Header */}
        {(label || labelRight) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <label
                htmlFor={selectId}
                className={`block text-xs font-bold text-slate-700 ${labelClassName}`}
              >
                {label}
                {required && <span className="text-rose-500 ml-1">*</span>}
                {optional && (
                  <span className="text-slate-400 font-normal ml-1.5 text-[11px]">
                    (Optional)
                  </span>
                )}
              </label>
            )}
            {labelRight && (
              <div className="text-xs font-semibold text-slate-500">
                {labelRight}
              </div>
            )}
          </div>
        )}

        {/* Select & Controls wrapper */}
        <div className="relative flex items-center">
          {/* Left Icon */}
          {effectiveLeftIcon && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-slate-400 transition-colors ${currentSize.icon}`}
            >
              {effectiveLeftIcon}
            </div>
          )}

          {/* Select Element */}
          <select
            ref={ref}
            id={selectId}
            name={name}
            disabled={isEffectivelyDisabled}
            className={`w-full border ${currentSize.rounded} ${currentSize.fontSize} ${currentSize.py} text-slate-800 appearance-none focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer ${paddingLeftClass} ${paddingRightClass} ${variantStyles[variant]} ${errorStyles} ${selectClassName} ${className}`}
            aria-invalid={Boolean(error)}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="text-slate-800 bg-white font-normal"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Trailing Chevron or Loading Spinner */}
          {!hideChevron && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${currentSize.chevronRight} pointer-events-none flex items-center justify-center text-slate-400 transition-transform`}
            >
              {isLoading ? (
                <div
                  className={`${currentSize.chevron} border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin`}
                />
              ) : customChevron ? (
                customChevron
              ) : (
                <svg
                  className={`${currentSize.chevron} text-slate-400`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Error or Helper Message */}
        {typeof error === "string" && error ? (
          <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1 animate-in fade-in duration-200">
            <svg
              className="w-3.5 h-3.5 shrink-0 text-rose-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <div className="mt-1.5 text-[11px] text-slate-500 font-medium">
            {helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
