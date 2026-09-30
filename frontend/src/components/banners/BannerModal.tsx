import React, { useState, useEffect } from "react";
import { Banner, BannerType, CreateBannerRequest, UpdateBannerRequest } from "../../types/banner";
import { handleSingleImageFileUpload } from "../../utils/image.utils";
import { BANNER_GRADIENT_PRESETS, BANNER_TYPES, BANNER_DEFAULT_VALUES } from "../../constants/banners.constants";
import { MESSAGES } from "../../constants/messages";
import { toast } from "react-toastify";
import {
  formatDateForInput,
  formatInputToIso,
  isValidBannerDateRange,
} from "../../utils/banner.utils";
import { BannerLivePreview } from "./BannerLivePreview";
import { Button, Modal, Input, Textarea, Select, Icon } from "../common";
import { useTranslation } from "react-i18next";

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBannerRequest | UpdateBannerRequest) => Promise<void>;
  bannerToEdit?: Banner | null;
  loading?: boolean;
}

export const BannerModal: React.FC<BannerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bannerToEdit,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<BannerType>(BANNER_DEFAULT_VALUES.TYPE);
  const [badgeText, setBadgeText] = useState("");
  const [buttonText, setButtonText] = useState(BANNER_DEFAULT_VALUES.BUTTON_TEXT);
  const [link, setLink] = useState(BANNER_DEFAULT_VALUES.LINK);
  const [image, setImage] = useState("");
  const [bgGradient, setBgGradient] = useState(BANNER_DEFAULT_VALUES.BG_GRADIENT);
  const [priority, setPriority] = useState(BANNER_DEFAULT_VALUES.PRIORITY);
  const [isActive, setIsActive] = useState(BANNER_DEFAULT_VALUES.IS_ACTIVE);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (bannerToEdit) {
      setTitle(bannerToEdit.title || "");
      setSubtitle(bannerToEdit.subtitle || "");
      setDescription(bannerToEdit.description || "");
      setType(bannerToEdit.type || BANNER_DEFAULT_VALUES.TYPE);
      setBadgeText(bannerToEdit.badgeText || "");
      setButtonText(bannerToEdit.buttonText || BANNER_DEFAULT_VALUES.BUTTON_TEXT);
      setLink(bannerToEdit.link || BANNER_DEFAULT_VALUES.LINK);
      setImage(bannerToEdit.image || "");
      setBgGradient(bannerToEdit.bgGradient || BANNER_DEFAULT_VALUES.BG_GRADIENT);
      setPriority(bannerToEdit.priority || 0);
      setIsActive(bannerToEdit.isActive !== undefined ? bannerToEdit.isActive : true);
      setStartDate(formatDateForInput(bannerToEdit.startDate));
      setEndDate(formatDateForInput(bannerToEdit.endDate));
    } else {
      // Default new banner
      setTitle(BANNER_DEFAULT_VALUES.TITLE);
      setSubtitle(BANNER_DEFAULT_VALUES.SUBTITLE);
      setDescription(BANNER_DEFAULT_VALUES.DESCRIPTION);
      setType(BANNER_DEFAULT_VALUES.TYPE);
      setBadgeText(BANNER_DEFAULT_VALUES.BADGE_TEXT);
      setButtonText(BANNER_DEFAULT_VALUES.BUTTON_TEXT);
      setLink(BANNER_DEFAULT_VALUES.LINK);
      setImage(BANNER_DEFAULT_VALUES.IMAGE);
      setBgGradient(BANNER_DEFAULT_VALUES.BG_GRADIENT);
      setPriority(BANNER_DEFAULT_VALUES.PRIORITY);
      setIsActive(BANNER_DEFAULT_VALUES.IS_ACTIVE);
      setStartDate("");
      setEndDate("");
    }
  }, [bannerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleSingleImageFileUpload(e, {
      onSuccess: setImage,
      setUploading: setUploadingImage,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t("messages.banners.titleRequired", { defaultValue: MESSAGES.BANNERS.TITLE_REQUIRED }));
      return;
    }

    if (!isValidBannerDateRange(startDate, endDate)) {
      toast.error(t("messages.banners.invalidDates", { defaultValue: MESSAGES.BANNERS.INVALID_DATES }));
      return;
    }

    const payload: CreateBannerRequest = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      type,
      badgeText: badgeText.trim() || undefined,
      buttonText: buttonText.trim() || "Shop Now",
      link: link.trim() || "/products",
      image: image.trim() || undefined,
      bgGradient: bgGradient.trim() || undefined,
      priority: Number(priority) || 0,
      isActive,
      startDate: formatInputToIso(startDate),
      endDate: formatInputToIso(endDate),
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      isLoading={loading}
      badge={
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
          {bannerToEdit ? t("admin.editBannerCampaign", { defaultValue: "Edit Banner Campaign" }) : t("admin.newBannerCampaign", { defaultValue: "New Banner Campaign" })}
        </span>
      }
      title={bannerToEdit ? t("admin.updateDynamicBanner", { defaultValue: "Update Dynamic Banner" }) : t("admin.createDynamicBanner", { defaultValue: "Create Dynamic Banner" })}
      bodyClassName="p-6"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={loading}
          >
            {bannerToEdit ? t("common.saveChanges", { defaultValue: "Save Changes" }) : t("admin.createCampaign", { defaultValue: "Create Campaign" })}
          </Button>
        </>
      }
    >
      {/* Modal Form Content */}
      <form id="banner-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Live Preview Card Header */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            {t("admin.livePreviewHeader", { defaultValue: "Live Banner Header Preview" })}
          </label>
          <BannerLivePreview
            title={title}
            subtitle={subtitle}
            type={type}
            badgeText={badgeText}
            buttonText={buttonText}
            image={image}
            bgGradient={bgGradient}
          />
        </div>

        {/* 1. Campaign Type & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t("admin.campaignType", { defaultValue: "Campaign Type" })}
            size="sm"
            value={type}
            onChange={(e) => setType(e.target.value as BannerType)}
            fullWidth
          >
            {BANNER_TYPES.map((bt) => (
              <option key={bt.value} value={bt.value}>
                {bt.label} — ({bt.desc})
              </option>
            ))}
          </Select>

          <Input
            label={t("admin.displayPriority", { defaultValue: "Display Priority (Higher = First)" })}
            optional
            type="number"
            min="0"
            max="1000"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            placeholder="0"
            size="sm"
          />
        </div>

        {/* 2. Title & Subtitle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("admin.bannerTitle", { defaultValue: "Banner Title" })}
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Diwali & Festive Mega Bonanza"
            size="sm"
          />

          <Input
            label={t("admin.subtitle", { defaultValue: "Subtitle" })}
            optional
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Up to 60% Off Trending Essentials"
            size="sm"
          />
        </div>

        {/* 3. Description */}
        <Textarea
          label={t("admin.descriptionParagraph", { defaultValue: "Description Paragraph" })}
          optional
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Highlight offers, warranty info, or seasonal promotions..."
        />

        {/* 4. Badge, Button Text, & CTA Link */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t("admin.badgeText", { defaultValue: "Badge Text" })}
            optional
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            placeholder="e.g. Festival Special"
            size="sm"
          />

          <Input
            label={t("admin.buttonText", { defaultValue: "Button Text" })}
            optional
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="e.g. Shop Festive Deals"
            size="sm"
          />

          <Input
            label={t("admin.destinationLink", { defaultValue: "CTA Destination Link" })}
            optional
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="e.g. /deals or /categories/electronics"
            size="sm"
          />
        </div>

        {/* 5. Theme Gradient Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            {t("admin.gradientTheme", { defaultValue: "Background Color Gradient Theme" })}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {BANNER_GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setBgGradient(preset.value)}
                className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition-all text-left cursor-pointer ${
                  bgGradient === preset.value
                    ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg ${preset.preview} flex-shrink-0 shadow-xs flex items-center justify-center`}
                >
                  {bgGradient === preset.value && (
                    <Icon name="check" className="w-3.5 h-3.5 text-slate-900" />
                  )}
                </span>
                <span className="text-[11px] font-bold text-slate-800 truncate">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Image Upload / URL */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t("admin.bannerGraphic", { defaultValue: "Banner Graphic / Background Image (Optional)" })}
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
              <Icon name="upload-cloud" className="w-4 h-4 text-indigo-600" />
              <span>{uploadingImage ? t("common.uploading", { defaultValue: "Uploading..." }) : t("common.uploadImage", { defaultValue: "Upload Image" })}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>

            <div className="flex-1 w-full">
              <Input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Or paste image URL (e.g. /uploads/banner.jpg or https://...)"
                size="sm"
              />
            </div>

            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                className="text-xs text-rose-600 font-bold hover:underline px-2"
              >
                {t("cart.remove", { defaultValue: "Remove" })}
              </button>
            )}
          </div>
        </div>

        {/* 7. Scheduling Dates */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
            <Icon name="calendar" className="w-4 h-4 text-indigo-600" />
            <span>{t("admin.scheduleWindow", { defaultValue: "Automated Schedule Window (Optional)" })}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {t("admin.scheduleWindowDesc", { defaultValue: "Leave blank to keep active indefinitely while status is enabled. If set, banner will only display between start and end dates." })}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              label={t("admin.startDate", { defaultValue: "Start Date & Time" })}
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="sm"
            />

            <Input
              label={t("admin.endDate", { defaultValue: "End Date & Time (Displays Countdown)" })}
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="sm"
            />
          </div>
        </div>

        {/* 8. Active Status Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div>
            <p className="text-xs font-bold text-slate-900">{t("admin.campaignActiveStatus", { defaultValue: "Campaign Active Status" })}</p>
            <p className="text-[11px] text-slate-500">
              {t("admin.campaignActiveStatusDesc", { defaultValue: "Turn on to make this banner eligible for live storefront display." })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              isActive ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BannerModal;
