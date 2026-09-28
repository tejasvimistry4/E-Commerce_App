import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchAdminCategories,
  toggleCategoryStatus,
  deleteCategory,
} from "../../redux/categories/categorySlice";
import { Category } from "../../api/category.api";
import { CategoryModal } from "../../components/categories/CategoryModal";
import { useDebounce } from "../../hooks/useDebounce";
import {
  SearchInput,
  Badge,
  StatsCard,
  Icon,
  Button,
  EmptyState,
  ConfirmationModal,
} from "../../components/common";
import { getImageUrl } from "../../utils/image.utils";
import { MESSAGES } from "../../constants/messages";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export const AdminCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { categories, loading, actionLoading } = useAppSelector(
    (state) => state.categories
  );

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<"all" | "roots" | "subcategories">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Delete confirmation modal state
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
    childCount: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  const handleOpenCreateModal = () => {
    setCategoryToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setCategoryToEdit(cat);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (id: string, name: string, childCount: number) => {
    setCategoryToDelete({ id, name, childCount });
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      await dispatch(deleteCategory(categoryToDelete.id)).unwrap();
      toast.success(t("messages.categories.deleted", { name: categoryToDelete.name, defaultValue: MESSAGES.CATEGORIES.DELETED(categoryToDelete.name) }));
      setCategoryToDelete(null);
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: MESSAGES.CATEGORIES.DELETE_FAILED })));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
    try {
      await dispatch(toggleCategoryStatus(id)).unwrap();
      toast.info(t("messages.categories.statusToggled", { name, status: !currentStatus ? t("admin.statusActive", { defaultValue: "Active" }) : t("admin.statusInactive", { defaultValue: "Inactive" }), defaultValue: MESSAGES.CATEGORIES.STATUS_TOGGLED(name, !currentStatus) }));
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: MESSAGES.CATEGORIES.STATUS_FAILED })));
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        cat.name.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term));

      if (!matchesSearch) return false;
    }

    if (activeTab === "roots" && cat.parentId) return false;
    if (activeTab === "subcategories" && !cat.parentId) return false;

    if (statusFilter === "active" && !cat.isActive) return false;
    if (statusFilter === "inactive" && cat.isActive) return false;

    return true;
  });

  const rootCount = categories.filter((c) => !c.parentId).length;
  const subcategoryCount = categories.filter((c) => Boolean(c.parentId)).length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("admin.categories", { defaultValue: "Categories" })}
          </h1>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          disabled={actionLoading}
          variant="primary"
          size="md"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          {t("admin.createCategory", { defaultValue: "Create New Category" })}
        </Button>
      </div>

      {/* Reusable KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          title={t("categories.totalEntries", { defaultValue: "Total Categories" })}
          value={categories.length}
          subtitle={t("categories.allCatalogGroups", { defaultValue: "Catalog Groups" })}
          icon={<Icon name="layers" className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          loading={loading}
        />
        <StatsCard
          title={t("categories.rootDepartments", { defaultValue: "Root Departments" })}
          value={rootCount}
          subtitle={t("categories.topLevelGroups", { defaultValue: "Top-Level Groups" })}
          icon={<Icon name="folder" className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50 border border-purple-100"
          loading={loading}
        />
        <StatsCard
          title={t("admin.subcategories", { defaultValue: "Subcategories" })}
          value={subcategoryCount}
          subtitle={t("categories.nestedChildGroups", { defaultValue: "Nested Subgroups" })}
          icon={<Icon name="grid" className="w-5 h-5 text-pink-600" />}
          iconBg="bg-pink-50 border border-pink-100"
          loading={loading}
        />
        <StatsCard
          title={t("products.activeStatus", { defaultValue: "Active Status" })}
          value={activeCount}
          subtitle={`${inactiveCount} ${t("admin.statusInactive", { defaultValue: "Inactive" })}`}
          icon={<Icon name="check-circle" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          badge={{ text: `${Math.round((activeCount / (categories.length || 1)) * 100)}% Live`, variant: "success" }}
          loading={loading}
        />
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t("categories.searchPlaceholder", { defaultValue: "Search category by name, slug, or keywords..." })}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">
              {t("common.type", { defaultValue: "Type" })}:
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.all", { defaultValue: "All" })} ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("roots")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "roots"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("categories.rootDepartments", { defaultValue: "Root Depts" })} ({rootCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subcategories")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "subcategories"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("admin.subcategories", { defaultValue: "Subcategories" })} ({subcategoryCount})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">
              {t("common.visibility", { defaultValue: "Visibility" })}:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.anyStatus", { defaultValue: "Any Status" })}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("admin.statusActive", { defaultValue: "Active Only" })} ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "inactive"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("admin.statusInactive", { defaultValue: "Inactive" })} ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Categories Data Table View */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">{t("categories.categoryDetails", { defaultValue: "Category Details" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("products.urlSlug", { defaultValue: "Slug" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("categories.hierarchyLevel", { defaultValue: "Hierarchy Level" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("admin.subcategories", { defaultValue: "Subcategories" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("products.activeStatus", { defaultValue: "Status" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("common.createdDate", { defaultValue: "Created Date" })}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{t("common.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCategories.map((cat) => {
                const childCount = cat.children?.length || cat._count?.children || 0;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Name & Thumbnail */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-slate-900">
                      <div className="flex items-center space-x-3.5">
                        {cat.image ? (
                          <img
                            src={getImageUrl(cat.image)}
                            alt={cat.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shadow-2xs flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100/80 flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0">
                            {cat.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                            {cat.name}
                          </p>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5 font-normal">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-mono text-[11px] text-slate-500">
                      /{cat.slug}
                    </td>

                    {/* Hierarchy Level */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                      {cat.parent ? (
                        <Badge variant="neutral" size="sm">
                          ↳ {cat.parent.name}
                        </Badge>
                      ) : (
                        <Badge variant="primary" size="sm">
                          {t("admin.rootDepartment", { defaultValue: "Root Department" })}
                        </Badge>
                      )}
                    </td>

                    {/* Subcategories count */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                      <span className="font-bold text-slate-800">{childCount}</span>
                      <span className="text-slate-400 ml-1">{t("admin.subcategories", { defaultValue: "subcategories" })}</span>
                    </td>

                    {/* Active Status Toggle */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                      <Badge
                        variant={cat.isActive ? "success" : "warning"}
                        size="sm"
                        dot
                        onClick={() => handleToggleStatus(cat.id, cat.name, cat.isActive)}
                      >
                        {cat.isActive ? t("admin.statusActive", { defaultValue: "Active" }) : t("admin.statusInactive", { defaultValue: "Inactive" })}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-slate-500 text-[11px]">
                      {new Date(cat.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          title={t("categories.editCategory", { defaultValue: "Edit Category" })}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(cat.id, cat.name, childCount)}
                          title={t("categories.deleteCategory", { defaultValue: "Delete Category" })}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      title={t("categories.noMatchingCategories", { defaultValue: "No matching categories found" })}
                      description={t("categories.noMatchingCategoriesDesc", { defaultValue: "Try resetting your search query or adjusting your filters." })}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Category Create / Edit Modal */}
      {modalOpen && (
        <CategoryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          categoryToEdit={categoryToEdit}
          existingCategories={categories}
        />
      )}

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => !isDeleting && setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={categoryToDelete?.childCount && categoryToDelete.childCount > 0 ? t("categories.deleteCategoryWithSub", { defaultValue: "Delete Category with Subcategories" }) : t("categories.deleteCategory", { defaultValue: "Delete Category" })}
        confirmText={t("categories.deleteCategory", { defaultValue: "Delete Category" })}
        message={
          categoryToDelete ? (
            <div className="space-y-3">
              <p>
                {t("categories.deleteConfirm", { defaultValue: "Are you sure you want to delete category" })}{" "}
                <span className="font-bold text-slate-900">"{categoryToDelete.name}"</span>?
              </p>
              {categoryToDelete.childCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <div className="space-y-1">
                    <p className="font-bold">{t("categories.subcategoriesAffected", { defaultValue: "Subcategories will be affected" })}</p>
                    <p className="text-amber-700">
                      {t("categories.subcategoriesAffectedDesc", { count: categoryToDelete.childCount, defaultValue: `This category currently has ${categoryToDelete.childCount} subcategories. Deleting this parent category will cascade or remove its child departments.` })}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {t("common.cannotUndo", { defaultValue: "This action cannot be undone." })}
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
};

export default AdminCategoriesPage;
