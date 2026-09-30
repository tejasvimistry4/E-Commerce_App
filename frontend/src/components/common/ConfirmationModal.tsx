import React from "react";
import { Modal } from "./Modal";
import { Button, ButtonVariant } from "./Button";
import { Icon } from "./Icon";

export type ConfirmationVariant = "danger" | "warning" | "primary" | "info";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  itemDetails?: React.ReactNode;
  children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  icon,
  itemDetails,
  children,
}) => {
  // Variant-specific styling and default icon
  const getVariantConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Icon name="trash" className="w-5 h-5 text-rose-600" />,
          iconBg: "bg-rose-50 border-rose-100 text-rose-600 shadow-rose-500/10",
          buttonVariant: "danger" as ButtonVariant,
          defaultTitle: "Confirm Deletion",
          defaultConfirmText: "Delete",
          confirmButtonCustom: "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 active:scale-[0.98]",
        };
      case "warning":
        return {
          icon: <Icon name="alert-triangle" className="w-5 h-5 text-amber-600" />,
          iconBg: "bg-amber-50 border-amber-100 text-amber-600 shadow-amber-500/10",
          buttonVariant: "primary" as ButtonVariant,
          defaultTitle: "Attention Required",
          defaultConfirmText: "Proceed",
          confirmButtonCustom: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs active:scale-[0.98]",
        };
      case "info":
        return {
          icon: <Icon name="info" className="w-5 h-5 text-sky-600" />,
          iconBg: "bg-sky-50 border-sky-100 text-sky-600 shadow-sky-500/10",
          buttonVariant: "primary" as ButtonVariant,
          defaultTitle: "Confirmation",
          defaultConfirmText: "Confirm",
          confirmButtonCustom: "bg-sky-600 hover:bg-sky-700 text-white shadow-xs active:scale-[0.98]",
        };
      case "primary":
      default:
        return {
          icon: <Icon name="check-circle" className="w-5 h-5 text-indigo-600" />,
          iconBg: "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-indigo-500/10",
          buttonVariant: "primary" as ButtonVariant,
          defaultTitle: "Confirm Action",
          defaultConfirmText: "Confirm",
          confirmButtonCustom: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-[0.98]",
        };
    }
  };

  const config = getVariantConfig();
  const displayTitle = title || config.defaultTitle;
  const displayConfirmText = confirmText || config.defaultConfirmText;

  const footerContent = (
    <>
      <Button
        type="button"
        variant="outline"
        size="md"
        disabled={isLoading}
        onClick={onClose}
        className="flex-1 sm:flex-initial"
      >
        {cancelText}
      </Button>

      <Button
        type="button"
        variant={config.buttonVariant}
        size="md"
        loading={isLoading}
        onClick={onConfirm}
        className={`flex-1 sm:flex-initial font-bold ${config.confirmButtonCustom}`}
      >
        {displayConfirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isLoading={isLoading}
      title={displayTitle}
      subtitle="Action confirmation"
      icon={icon || config.icon}
      iconBg={config.iconBg}
      footer={footerContent}
    >
      <div className="p-6 space-y-4">
        {message && (
          <div className="text-sm text-slate-600 leading-relaxed font-medium">
            {message}
          </div>
        )}

        {itemDetails && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            {itemDetails}
          </div>
        )}

        {children}
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
