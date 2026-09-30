import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchAdminProducts,
  toggleProductStatus,
  deleteProduct,
} from "../../redux/products/productSlice";
import { fetchAdminCategories } from "../../redux/categories/categorySlice";
import { Product } from "../../api/product.api";
import { ProductModal } from "../../components/products/ProductModal";
import { useDebounce } from "../../hooks/useDebounce";
import {
  SearchInput,
  Badge,
  StatsCard,
  Icon,
  Button,
  EmptyState,
  ConfirmationModal,
  Select,
} from "../../components/common";
import { getImageUrl } from "../../utils/image.utils";
import { toast } from "react-toastify";

export const AdminProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { products, adminStats, loading, actionLoading } = useAppSelector(
    (state) => state.products
  );
  const { categories } = useAppSelector((state) => state.categories);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "featured" | "outofstock">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  const handleOpenCreateModal = () => {
    setProductToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setModalOpen(true);
  };

  const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
    try {
      await dispatch(toggleProductStatus(id)).unwrap();
      toast.info(t("messages.products.statusToggled", { name, status: !currentStatus ? t("common.active") : t("common.inactive"), defaultValue: `Product "${name}" is now ${!currentStatus ? "active" : "inactive"}.` }));
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: "Failed to update status." })));
    }
  };

  const handleOpenDeleteModal = (id: string, name: string) => {
    setProductToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await dispatch(deleteProduct(productToDelete.id)).unwrap();
      toast.success(t("messages.products.deleted", { name: productToDelete.name, defaultValue: `Product "${productToDelete.name}" successfully deleted.` }));
      setProductToDelete(null);
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: "Failed to delete product." })));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.category && p.category.name.toLowerCase().includes(term));

      if (!matchesSearch) return false;
    }

    if (selectedCategory && p.categoryId !== selectedCategory) {
      return false;
    }

    if (statusFilter === "active" && !p.isActive) return false;
    if (statusFilter === "inactive" && p.isActive) return false;
    if (statusFilter === "featured" && !p.isFeatured) return false;
    if (statusFilter === "outofstock" && p.stock > 0) return false;

    return true;
  });

  const totalCount = adminStats?.total ?? products.length;
  const activeCount = adminStats?.active ?? products.filter((p) => p.isActive).length;
  const outOfStockCount = adminStats?.outOfStock ?? products.filter((p) => p.stock === 0).length;
  const featuredCount = adminStats?.featured ?? products.filter((p) => p.isFeatured).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("admin.products", { defaultValue: "Products" })}
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
          {t("admin.addNewProduct", { defaultValue: "Add New Product" })}
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          title={t("admin.catalogProducts", { defaultValue: "Total Products" })}
          value={totalCount}
          subtitle={t("admin.catalogItems", { defaultValue: "Catalog Inventory" })}
          icon={<Icon name="package" className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          loading={loading}
        />
        <StatsCard
          title={t("common.active", { defaultValue: "Active Products" })}
          value={activeCount}
          subtitle={t("admin.liveOnStorefront", { defaultValue: "Live on Storefront" })}
          icon={<Icon name="check-circle" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          badge={{ text: `${Math.round((activeCount / (totalCount || 1)) * 100)}% Live`, variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title={t("common.outOfStock", { defaultValue: "Out of Stock" })}
          value={outOfStockCount}
          subtitle={t("admin.needsRestocking", { defaultValue: "Needs Restocking" })}
          icon={<Icon name="alert-triangle" className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50 border border-rose-100"
          valueClassName={outOfStockCount > 0 ? "text-rose-600" : "text-slate-900"}
          badge={outOfStockCount > 0 ? { text: "Action Needed", variant: "danger" } : undefined}
          loading={loading}
        />
        <StatsCard
          title={t("common.featured", { defaultValue: "Featured Items" })}
          value={featuredCount}
          subtitle={t("admin.spotlightShowcases", { defaultValue: "Homepage Spotlights" })}
          icon={<Icon name="star" className="w-5 h-5 text-amber-500 fill-amber-400" />}
          iconBg="bg-amber-50 border border-amber-100"
          valueClassName="text-amber-700"
          loading={loading}
        />
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t("common.searchPlaceholder", { defaultValue: "Search products, categories..." })}
          />

          <div className="w-full sm:w-64">
            <Select
              size="sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter products by category"
              fullWidth
            >
              <option value="">{t("categories.allDepartments", { defaultValue: "All Categories" })} ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent ? `↳ ${cat.parent.name} > ${cat.name}` : `📁 ${cat.name}`}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">{t("common.filter", { defaultValue: "Filter:" })}</span>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.all", { defaultValue: "All" })} ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.active", { defaultValue: "Active" })} ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "inactive"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.inactive", { defaultValue: "Inactive" })} ({totalCount - activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("featured")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "featured"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.featured", { defaultValue: "Featured" })} ★ ({featuredCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("outofstock")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "outofstock"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
            >
              {t("common.outOfStock", { defaultValue: "Out of Stock" })} ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">{t("common.details", { defaultValue: "Product Details" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("common.category", { defaultValue: "Category" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("common.price", { defaultValue: "Price" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("common.stock", { defaultValue: "Stock" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("common.status", { defaultValue: "Status" })}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{t("common.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* Name, Image, and Badges */}
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-slate-900">
                    <div className="flex items-center space-x-3.5">
                      {p.thumbnail || p.images?.[0] ? (
                        <img
                          src={getImageUrl(p.thumbnail || p.images[0])}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shadow-2xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100/80 flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0">
                          📦
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                            {p.name}
                          </span>
                          {p.isFeatured && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-pink-50 text-pink-700 border border-pink-200 flex-shrink-0">
                              ★ {t("common.featured", { defaultValue: "Featured" })}
                            </span>
                          )}
                          {p.variants && p.variants.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex-shrink-0">
                              ⚡ {p.variants.length} {p.variants.length === 1 ? "Variant" : "Variants"}
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5 font-normal">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                    {p.category ? (
                      <Badge variant="primary" size="sm">
                        📁 {p.category.name}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Uncategorized</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-black text-slate-900 text-sm">
                    {p.variants && p.variants.length > 0 ? (
                      <div>
                        <span>₹{Number(p.price).toFixed(2)}</span>
                        {Math.min(...p.variants.map((v) => v.price)) !== Math.max(...p.variants.map((v) => v.price)) && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            (₹{Math.min(...p.variants.map((v) => v.price)).toFixed(0)} - ₹{Math.max(...p.variants.map((v) => v.price)).toFixed(0)})
                          </span>
                        )}
                      </div>
                    ) : (
                      `₹${Number(p.price).toFixed(2)}`
                    )}
                  </td>

                  {/* Stock */}
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                    {(() => {
                      const effectiveStock = p.variants && p.variants.length > 0
                        ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                        : p.stock;

                      if (effectiveStock === 0) {
                        return (
                          <span className="inline-block font-bold text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            {t("common.outOfStock", { defaultValue: "0 (Out)" })}
                          </span>
                        );
                      }
                      if (effectiveStock <= 5) {
                        return (
                          <span className="inline-block font-bold text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {effectiveStock} units
                          </span>
                        );
                      }
                      return (
                        <div>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {effectiveStock} units
                          </span>
                          {p.variants && p.variants.length > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              across {p.variants.length} variants
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Active Visibility Toggle */}
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                    <Badge
                      variant={p.isActive ? "success" : "warning"}
                      size="sm"
                      dot
                      onClick={() => handleToggleStatus(p.id, p.name, p.isActive)}
                    >
                      {p.isActive ? t("common.active", { defaultValue: "Active" }) : t("common.inactive", { defaultValue: "Inactive" })}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(p)}
                        title={t("common.edit", { defaultValue: "Edit Product" })}
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
                        onClick={() => handleOpenDeleteModal(p.id, p.name)}
                        title={t("common.delete", { defaultValue: "Delete Product" })}
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
              ))}

              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8">
                    <EmptyState
                      icon="📦"
                      title={t("products.noProductsFound", { defaultValue: "No matching products found" })}
                      description={t("products.noProductsDesc", { defaultValue: "Try adjusting your search criteria or create your first product catalog entry." })}
                      action={
                        <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                          + {t("admin.addNewProduct", { defaultValue: "Add First Product" })}
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      {modalOpen && (
        <ProductModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          productToEdit={productToEdit}
          categories={categories}
        />
      )}

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(productToDelete)}
        onClose={() => !isDeleting && setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={t("common.confirmDeletion", { defaultValue: "Delete Product" })}
        confirmText={t("common.delete", { defaultValue: "Delete Product" })}
        message={
          productToDelete ? (
            <p>
              Are you sure you want to delete product{" "}
              <span className="font-bold text-slate-900">"{productToDelete.name}"</span>?
              This action cannot be undone.
            </p>
          ) : null
        }
      />
    </div>
  );
};

export default AdminProductsPage;
