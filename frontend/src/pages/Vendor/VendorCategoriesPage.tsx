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
import { toast } from "react-toastify";

export const VendorCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories, loading, actionLoading } = useAppSelector(
    (state) => state.categories
  );
  const { user } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<"all" | "myCategories" | "platform">("all");
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
      toast.success(`Category "${categoryToDelete.name}" successfully deleted.`);
      setCategoryToDelete(null);
    } catch (err: any) {
      toast.error(String(err || "Failed to delete category."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
    try {
      await dispatch(toggleCategoryStatus(id)).unwrap();
      toast.info(`Category "${name}" is now ${!currentStatus ? "active" : "inactive"}.`);
    } catch (err: any) {
      toast.error(String(err || "Failed to update category status."));
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

    const isMyCategory = cat.vendorId === user?.id;
    if (activeTab === "myCategories" && !isMyCategory) return false;
    if (activeTab === "platform" && isMyCategory) return false;

    return true;
  });

  const myCategoriesCount = categories.filter((c) => c.vendorId === user?.id).length;
  const platformCategoriesCount = categories.filter((c) => !c.vendorId).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Category Sections
            </span>
            <span className="text-xs text-slate-400">• Store Classification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Product Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse marketplace classification departments or create custom categories for your catalog.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          disabled={actionLoading}
          variant="primary"
          size="md"
          className="bg-emerald-600 hover:bg-emerald-700"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Create Custom Category
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Available Categories"
          value={categories.length}
          subtitle="Total Usable Departments"
          icon={<Icon name="layers" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          loading={loading}
        />
        <StatsCard
          title="My Custom Categories"
          value={myCategoriesCount}
          subtitle="Created by Your Store"
          icon={<Icon name="folder" className="w-5 h-5 text-teal-600" />}
          iconBg="bg-teal-50 border border-teal-100"
          valueClassName="text-teal-700 font-black"
          badge={{ text: "Custom", variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title="Platform Departments"
          value={platformCategoriesCount}
          subtitle="Standard Marketplace Groups"
          icon={<Icon name="grid" className="w-5 h-5 text-slate-700" />}
          iconBg="bg-slate-100 border border-slate-200"
          loading={loading}
        />
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search category by name, slug, or keywords..."
          />
        </div>

        <div className="flex items-center space-x-1.5 pt-3 border-t border-slate-100 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
            }`}
          >
            All Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("myCategories")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "myCategories"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
            }`}
          >
            My Custom Categories ({myCategoriesCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("platform")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "platform"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
            }`}
          >
            Platform Default ({platformCategoriesCount})
          </button>
        </div>
      </div>

      {/* Categories Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Category Details</th>
                <th className="py-3.5 px-4 sm:px-6">Slug</th>
                <th className="py-3.5 px-4 sm:px-6">Ownership</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCategories.map((cat) => {
                const isOwner = cat.vendorId === user?.id;
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
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0">
                            {cat.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate max-w-[200px]">
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

                    {/* Ownership */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                      {isOwner ? (
                        <Badge variant="success" size="sm">
                          My Store Category
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Marketplace Default
                        </Badge>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                      <Badge
                        variant={cat.isActive ? "success" : "warning"}
                        size="sm"
                        dot={isOwner}
                        onClick={isOwner ? () => handleToggleStatus(cat.id, cat.name, cat.isActive) : undefined}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-right">
                      {isOwner ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            title="Edit Category"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
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
                            title="Delete Category"
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
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Global</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8">
                    <EmptyState
                      title="No matching categories found"
                      description="Try resetting your search query or create a custom store category."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Create / Edit Modal */}
      {modalOpen && (
        <CategoryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          categoryToEdit={categoryToEdit}
          existingCategories={categories}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => !isDeleting && setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title="Delete Category"
        confirmText="Delete Category"
        message={
          categoryToDelete ? (
            <p>
              Are you sure you want to delete category{" "}
              <span className="font-bold text-slate-900">"{categoryToDelete.name}"</span>?
              This action cannot be undone.
            </p>
          ) : null
        }
      />
    </div>
  );
};

export default VendorCategoriesPage;
