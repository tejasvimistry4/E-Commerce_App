import React from "react";
import { Link } from "react-router-dom";
import { Category } from "../../api/category.api";
import { getImageUrl } from "../../utils/image.utils";
import { Icon } from "../common/Icon";

interface CategoryCardProps {
  category: Category;
  isAdmin?: boolean;
  onEdit?: (category: Category) => void;
  onDelete?: (id: string, name: string) => void;
  onSelectSubcategory?: (slug: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between shadow-2xs">
      <div>
        {/* Top Badges & Admin Actions */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {category.parent ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                ↳ {category.parent.name}
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Icon name="layers" className="w-3 h-3" />
                <span>Department</span>
              </span>
            )}
            {!category.isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Inactive
              </span>
            )}
          </div>

          {/* Admin Edit/Delete Actions */}
          {isAdmin && onEdit && onDelete && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onEdit(category)}
                title="Edit Category"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <Icon name="edit" className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(category.id, category.name)}
                title="Delete Category"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Icon name="trash" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail & Title */}
        <div className="flex items-start space-x-3.5 mb-3">
          {category.image ? (
            <img
              src={getImageUrl(category.image)}
              alt={category.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 shadow-2xs flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base shadow-2xs flex-shrink-0">
              {category.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <Link
              to={`/products?category=${category.id}`}
              className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate block"
            >
              {category.name}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
              {category.description ||
                "Explore curated products and verified collections in this department."}
            </p>
          </div>
        </div>

        {/* Subcategories preview */}
        {category.children && category.children.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Popular Subcategories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {category.children.slice(0, 4).map((child) => (
                <Link
                  key={child.id}
                  to={`/products?category=${child.id}`}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200/80 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors"
                >
                  {child.name}
                </Link>
              ))}
              {category.children.length > 4 && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
                  +{category.children.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end text-xs">
        <Link
          to={`/products?category=${category.id}`}
          className="inline-flex items-center space-x-1.5 font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/link"
        >
          <span>Explore Products</span>
          <Icon name="arrow-right" className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default CategoryCard;
