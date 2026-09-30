import React, { useState, forwardRef } from "react";
import { Icon } from "./Icon";

export type InputSize = "sm" | "md" | "lg";
export type InputVariant = "default" | "filled" | "flush";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode;
  labelRight?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string | boolean;
  helperText?: React.ReactNode;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
  variant?: InputVariant;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelRight,
      required = false,
      optional = false,
      error,
      helperText,
      icon,
      leftIcon,
      rightIcon,
      size = "md",
      variant = "default",
      fullWidth = true,
      showPasswordToggle = false,
      containerClassName = "",
      labelClassName = "",
      className = "",
      type = "text",
      id,
      name,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const effectiveLeftIcon = leftIcon || icon;
    const isPasswordType = type === "password";
    const actualType = isPasswordType
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

    // Generated ID fallback if id is not provided but name is
    const inputId = id || (name ? `input-${name}` : undefined);

    const sizeStyles: Record<InputSize, { input: string; icon: string; py: string }> = {
      sm: {
        input: "py-2 text-xs rounded-xl",
        icon: "w-4 h-4",
        py: "py-2",
      },
      md: {
        input: "py-2.5 text-xs sm:text-sm rounded-xl",
        icon: "w-4 h-4 sm:w-5 sm:h-5",
        py: "py-2.5",
      },
      lg: {
        input: "py-3.5 text-sm sm:text-base rounded-2xl",
        icon: "w-5 h-5",
        py: "py-3.5",
      },
    };

    const variantStyles: Record<InputVariant, string> = {
      default:
        "bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15",
      filled:
        "bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15",
      flush:
        "bg-transparent border-b border-t-0 border-x-0 rounded-none px-0 border-slate-200 focus:border-indigo-500 focus:ring-0",
    };

    const errorStyles = error
      ? "!border-rose-300 !bg-rose-50/50 focus:!border-rose-400 focus:!ring-rose-500/15"
      : "";

    const paddingLeftClass = effectiveLeftIcon
      ? size === "lg"
        ? "pl-11"
        : size === "sm"
        ? "pl-9"
        : "pl-10"
      : variant === "flush"
      ? "pl-0"
      : "px-3.5";

    const paddingRightClass =
      isPasswordType || showPasswordToggle || rightIcon
        ? size === "lg"
          ? "pr-11"
          : size === "sm"
          ? "pr-9"
          : "pr-10"
        : variant === "flush"
        ? "pr-0"
        : "px-3.5";

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <div className={`${widthClass} ${containerClassName}`}>
        {/* Label and right side info */}
        {(label || labelRight) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <label
                htmlFor={inputId}
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

        {/* Input Wrapper */}
        <div className="relative flex items-center">
          {effectiveLeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <span className="flex items-center justify-center">
                {effectiveLeftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={actualType}
            disabled={disabled}
            className={`w-full border text-slate-900 placeholder-slate-400 font-medium transition-all outline-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size].input} ${paddingLeftClass} ${paddingRightClass} ${errorStyles} ${className}`}
            aria-invalid={Boolean(error)}
            {...props}
          />

          {/* Password Show/Hide or Custom Right Icon */}
          {isPasswordType || showPasswordToggle ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <Icon name="eye-off" className="w-4 h-4" />
              ) : (
                <Icon name="eye" className="w-4 h-4" />
              )}
            </button>
          ) : rightIcon ? (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              {rightIcon}
            </div>
          ) : null}
        </div>

        {/* Error or Helper text */}
        {typeof error === "string" && error ? (
          <p className="mt-1 text-xs font-medium text-rose-600 flex items-center gap-1">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  labelRight?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string | boolean;
  helperText?: React.ReactNode;
  size?: InputSize;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      labelRight,
      required = false,
      optional = false,
      error,
      helperText,
      size = "md",
      fullWidth = true,
      containerClassName = "",
      labelClassName = "",
      className = "",
      id,
      name,
      rows = 3,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (name ? `textarea-${name}` : undefined);
    const errorStyles = error
      ? "!border-rose-500 !bg-rose-50/40 focus:!border-rose-500 focus:!ring-rose-500/20"
      : "";
    const widthClass = fullWidth ? "w-full" : "";

    const sizeClasses = {
      sm: "px-3 py-2 text-xs",
      md: "px-3.5 py-2.5 text-xs sm:text-sm",
      lg: "px-4 py-3 text-sm sm:text-base",
    };

    return (
      <div className={`${widthClass} ${containerClassName}`}>
        {(label || labelRight) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <label
                htmlFor={textareaId}
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

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          disabled={disabled}
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all ${sizeClasses[size]} ${errorStyles} ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />

        {typeof error === "string" && error ? (
          <p className="mt-1 text-xs font-medium text-rose-600 flex items-center gap-1">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Input;
