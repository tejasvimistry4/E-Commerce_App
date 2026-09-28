import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchCategories } from "../../redux/categories/categorySlice";
import { CategoryCard } from "../../components/categories/CategoryCard";
import { EmptyState, Breadcrumb, Icon } from "../../components/common";
import { getImageUrl } from "../../utils/image.utils";

export const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDeptSlug = searchParams.get("dept");

  const { categories, loading } = useAppSelector((state) => state.categories);

  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Sync selectedParentId when URL query changes
  useEffect(() => {
    if (selectedDeptSlug && categories.length > 0) {
      const match = categories.find(
        (c) => c.slug === selectedDeptSlug && !c.parentId
      );
      if (match) {
        setSelectedParentId(match.id);
      }
    } else if (!selectedDeptSlug) {
      setSelectedParentId(null);
    }
  }, [selectedDeptSlug, categories]);

  // Root categories (top-level departments)
  const rootCategories = categories.filter((c) => !c.parentId && c.isActive);

  // Subcategories of selected parent (or all subcategories if none selected)
  const activeSubcategories = categories.filter((c) => {
    if (!c.parentId || !c.isActive) return false;
    if (selectedParentId) return c.parentId === selectedParentId;
    return true;
  });

  const handleSelectParent = (id: string | null, slug?: string) => {
    setSelectedParentId(id);
    if (slug) {
      setSearchParams({ dept: slug });
    } else {
      setSearchParams({});
    }
  };

  const selectedDepartment = categories.find((c) => c.id === selectedParentId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white pb-20 font-sans">

      {/* 1. Header & Breadcrumb Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Breadcrumbs */}
          <Breadcrumb
            className="mb-6"
            items={[
              { label: t("nav.home", "Home"), to: "/" },
              {
                label: t("nav.categories", "Categories"),
                onClick: () => handleSelectParent(null),
                active: !selectedDepartment && !selectedParentId,
              },
              ...(selectedDepartment
                ? [{ label: selectedDepartment.name, active: true }]
                : []),
            ]}
          />

          {/* Title Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                {t("categories.title", "Explore All Categories")}
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
                {t("categories.subtitle", "Browse verified product lines, specialized collections, and flagship department catalogs.")}
              </p>
            </div>
          </div>

          {/* Department Quick Filter Tabs */}
          <div className="mt-8 flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => handleSelectParent(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedParentId === null
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
            >
              {t("categories.allDepartments", "All Departments")}
            </button>
            {rootCategories.map((root) => (
              <button
                key={root.id}
                type="button"
                onClick={() => handleSelectParent(root.id, root.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedParentId === root.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
              >
                {root.name}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* 2. Main Categories Grid Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-56 rounded-2xl bg-slate-200/80 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Active Department Header */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selectedDepartment
                      ? t("categories.department", { name: selectedDepartment.name, defaultValue: `Department: ${selectedDepartment.name}` })
                      : t("categories.featuredDepartments", "Featured Departments")}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDepartment
                      ? selectedDepartment.description || "Browse collections in this department"
                      : "Select a department to view specific collections and subcategories"}
                  </p>
                </div>
                {selectedParentId && (
                  <button
                    type="button"
                    onClick={() => handleSelectParent(null)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors w-fit cursor-pointer shadow-2xs"
                  >
                    <Icon name="close" className="w-3.5 h-3.5" />
                    <span>{t("common.clearFilter", "Clear Filter")}</span>
                  </button>
                )}
              </div>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rootCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                  />
                ))}
              </div>

              {rootCategories.length === 0 && (
                <div className="rounded-2xl bg-white border border-slate-200/80 p-10 text-center shadow-xs">
                  <EmptyState
                    title={t("categories.noCategoriesFound", "No categories found")}
                    description={t("categories.noCategoriesDesc", { defaultValue: "No departments found. Check back soon for new collections." })}
                  />
                </div>
              )}
            </div>

            {/* Subcategories Explorer Section */}
            {activeSubcategories.length > 0 && (
              <div className="pt-8 border-t border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {selectedDepartment
                        ? t("categories.subcategoriesIn", { name: selectedDepartment.name, defaultValue: `Subcategories in ${selectedDepartment.name}` })
                        : t("categories.popularSubcategories", "Popular Subcategories")}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                  {activeSubcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/products?category=${sub.id}`}
                      className="group p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col items-center text-center shadow-2xs hover:scale-[1.02]"
                    >
                      <div className="w-11 h-11 rounded-xl bg-indigo-50/80 border border-slate-200/80 flex items-center justify-center text-base font-black text-indigo-700 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs mb-2.5 overflow-hidden">
                        {sub.image ? (
                          <img
                            src={getImageUrl(sub.image)}
                            alt={sub.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          sub.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {sub.name}
                      </h4>
                      {sub.parent && (
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 line-clamp-1">
                          {t("categories.inDepartment", { name: sub.parent.name, defaultValue: `in ${sub.parent.name}` })}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default CategoriesPage;

