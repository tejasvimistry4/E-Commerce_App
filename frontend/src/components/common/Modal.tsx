import React, { useEffect, useCallback } from "react";
import { Icon } from "./Icon";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  isLoading?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  backdropClassName?: string;
  ariaLabel?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-5xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = "md",
  title,
  subtitle,
  badge,
  icon,
  iconBg = "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  isLoading = false,
  header,
  footer,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  footerClassName = "",
  backdropClassName = "",
  ariaLabel,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && closeOnEsc && !isLoading) {
        onClose();
      }
    },
    [isOpen, closeOnEsc, isLoading, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick && !isLoading) {
      onClose();
    }
  };

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const hasDefaultHeader = Boolean(title || subtitle || badge || icon || showCloseButton);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 ${backdropClassName}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : ariaLabel || "Dialog Modal"}
    >
      <div
        className={`relative w-full ${sizeClass} bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in zoom-in-95 duration-200 text-slate-900 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {header ? (
          header
        ) : hasDefaultHeader ? (
          <div
            className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-shrink-0 bg-slate-50/50 ${headerClassName}`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {icon && (
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 ${iconBg}`}
                >
                  {icon}
                </div>
              )}

              <div className="min-w-0 flex-1">
                {badge && <div className="mb-1">{badge}</div>}
                {title && (
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer flex-shrink-0 shadow-2xs"
                aria-label="Close modal"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : null}

        {/* Modal Body */}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className={`px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
