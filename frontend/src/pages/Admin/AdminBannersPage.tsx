import React, { useEffect, useState, useMemo } from "react";
import { useBanners } from "../../hooks/useBanners";
import { Banner, BannerType, CreateBannerRequest, UpdateBannerRequest } from "../../types/banner";
import { BannerModal, BannerCard } from "../../components/banners";
import { ConfirmationModal, Button, Input, Icon, StatsCard } from "../../components/common";
import { BANNER_TYPES } from "../../constants/banners.constants";
import { MESSAGES } from "../../constants/messages";
import { getBannerScheduleStatus } from "../../utils/banner.utils";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export const AdminBannersPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    adminBanners,
    totalAdminBanners,
    loading,
    actionLoading,
    loadAdminBanners,
    createNewBanner,
    updateExistingBanner,
    toggleStatus,
    removeBanner,
  } = useBanners();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedType, setSelectedType] = useState<BannerType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [bannerToEdit, setBannerToEdit] = useState<Banner | null>(null);

  // Delete confirmation modal state
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAdminBanners();
  }, []);

  const handleOpenCreateModal = () => {
    setBannerToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (b: Banner) => {
    setBannerToEdit(b);
    setModalOpen(true);
  };

  const handleModalSubmit = async (data: CreateBannerRequest | UpdateBannerRequest) => {
    try {
      if (bannerToEdit) {
        await updateExistingBanner(bannerToEdit.id, data).unwrap();
        toast.success(t("messages.banners.updated", { title: data.title || bannerToEdit.title, defaultValue: MESSAGES.BANNERS.UPDATED(data.title || bannerToEdit.title) }));
      } else {
        await createNewBanner(data as CreateBannerRequest).unwrap();
        toast.success(t("messages.banners.created", { title: data.title || "", defaultValue: MESSAGES.BANNERS.CREATED(data.title || "") }));
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: MESSAGES.BANNERS.SAVE_FAILED })));
    }
  };

  const handleToggleStatus = async (b: Banner) => {
    try {
      await toggleStatus(b.id).unwrap();
      toast.info(t("messages.banners.statusToggled", { title: b.title, status: !b.isActive ? t("admin.statusActive", { defaultValue: "Active" }) : t("admin.statusInactive", { defaultValue: "Inactive" }), defaultValue: MESSAGES.BANNERS.STATUS_TOGGLED(b.title, !b.isActive) }));
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: MESSAGES.BANNERS.STATUS_FAILED })));
    }
  };

  const handleOpenDeleteModal = (b: Banner) => {
    setBannerToDelete(b);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    try {
      setIsDeleting(true);
      await removeBanner(bannerToDelete.id).unwrap();
      toast.success(t("messages.banners.deleted", { title: bannerToDelete.title, defaultValue: MESSAGES.BANNERS.DELETED(bannerToDelete.title) }));
      setBannerToDelete(null);
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: MESSAGES.BANNERS.DELETE_FAILED })));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return adminBanners.filter((b) => {
      if (debouncedSearchTerm.trim()) {
        const term = debouncedSearchTerm.toLowerCase();
        const matches =
          b.title.toLowerCase().includes(term) ||
          (b.subtitle && b.subtitle.toLowerCase().includes(term)) ||
          (b.badgeText && b.badgeText.toLowerCase().includes(term)) ||
          (b.description && b.description.toLowerCase().includes(term));
        if (!matches) return false;
      }

      if (selectedType !== "ALL" && b.type !== selectedType) {
        return false;
      }

      if (statusFilter === "active" && !b.isActive) return false;
      if (statusFilter === "inactive" && b.isActive) return false;

      return true;
    });
  }, [adminBanners, debouncedSearchTerm, selectedType, statusFilter]);

  // Metric counts
  const liveCount = adminBanners.filter((b) => getBannerScheduleStatus(b).label === "Live Now").length;
  const scheduledCount = adminBanners.filter((b) => getBannerScheduleStatus(b).label === "Scheduled").length;
  const inactiveCount = adminBanners.filter((b) => !b.isActive).length;

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("admin.banners", { defaultValue: "Banners & Promos" })}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t("admin.bannersSubtitle", { defaultValue: "Create, schedule, and customize dynamic promotional banners for festivals, sales, and seasonal campaigns." })}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Icon name="plus" className="w-4 h-4" />}
          onClick={handleOpenCreateModal}
        >
          {t("admin.createBanner", { defaultValue: "Create Banner Campaign" })}
        </Button>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("admin.totalBanners", { defaultValue: "Total Banners" })}
          value={totalAdminBanners}
          subtitle={t("admin.allConfiguredBanners", { defaultValue: "Configured Campaigns" })}
          icon={<Icon name="layers" className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          loading={loading}
        />
        <StatsCard
          title={t("admin.liveOnStorefront", { defaultValue: "Live on Storefront" })}
          value={liveCount}
          subtitle={t("admin.activeCampaigns", { defaultValue: "Currently Displaying" })}
          icon={<Icon name="check-circle" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          badge={{ text: "Active", variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title={t("admin.scheduledFuture", { defaultValue: "Scheduled" })}
          value={scheduledCount}
          subtitle={t("admin.futureCampaigns", { defaultValue: "Future Releases" })}
          icon={<Icon name="clock" className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50 border border-amber-100"
          valueClassName="text-amber-700"
          badge={scheduledCount > 0 ? { text: "Upcoming", variant: "warning" } : undefined}
          loading={loading}
        />
        <StatsCard
          title={t("admin.inactiveDisabled", { defaultValue: "Inactive" })}
          value={inactiveCount}
          subtitle={t("admin.disabledBanners", { defaultValue: "Hidden from Storefront" })}
          icon={<Icon name="eye-off" className="w-5 h-5 text-slate-500" />}
          iconBg="bg-slate-100 border border-slate-200"
          valueClassName="text-slate-600"
          loading={loading}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full md:w-80">
            <Input
              type="text"
              size="sm"
              leftIcon={<Icon name="search" className="w-4 h-4 text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("admin.searchBannersPlaceholder", { defaultValue: "Search by title, badge, subtitle..." })}
              fullWidth
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              {t("products.activeStatus", { defaultValue: "Status" })}:
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              {(["all", "active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s === "all" ? t("common.all", { defaultValue: "All" }) : s === "active" ? t("admin.statusActive", { defaultValue: "Active" }) : t("admin.statusInactive", { defaultValue: "Inactive" })}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedType === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {t("common.allTypes", { defaultValue: "All Types" })}
          </button>
          {BANNER_TYPES.map((bt) => (
            <button
              key={bt.value}
              type="button"
              onClick={() => setSelectedType(bt.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedType === bt.value
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {bt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Banner Cards List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredBanners.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBanners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Icon name="layers" className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t("admin.noBannersFound", { defaultValue: "No Banners Found" })}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t("admin.noBannersFoundDesc", { defaultValue: "No banner campaigns match your search or filter criteria. Create a new campaign to get started." })}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name="plus" className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            {t("admin.createFirstCampaign", { defaultValue: "Create First Campaign" })}
          </Button>
        </div>
      )}

      {/* 5. Banner Create / Edit Modal */}
      <BannerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        bannerToEdit={bannerToEdit}
        loading={actionLoading}
      />

      {/* 6. Reusable Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(bannerToDelete)}
        onClose={() => !isDeleting && setBannerToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={t("admin.deleteBannerTitle", { defaultValue: "Delete Banner Campaign" })}
        confirmText={t("admin.deleteBanner", { defaultValue: "Delete Banner" })}
        message={
          bannerToDelete ? (
            <p>
              {t("admin.deleteBannerConfirm", { defaultValue: "Are you sure you want to delete banner campaign" })}{" "}
              <span className="font-bold text-slate-900">"{bannerToDelete.title}"</span>?{" "}
              {t("common.cannotUndo", { defaultValue: "This action cannot be undone." })}
            </p>
          ) : null
        }
      />
    </div>
  );
};

export default AdminBannersPage;
