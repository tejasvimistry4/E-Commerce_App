import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useVisualSearch } from "../../hooks/useVisualSearch";
import { ProductCard } from "./ProductCard";
import { getImageUrl } from "../../utils/image.utils";

export interface SearchByImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: any) => void;
}

export const SearchByImageModal: React.FC<SearchByImageModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const {
    isSearching,
    results,
    error,
    selectedImage,
    previewUrl,
    threshold,
    setThreshold,
    searchByImage,
    clearSearch,
  } = useVisualSearch(0.90);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Clean state when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      searchByImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      searchByImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleExploreInCatalog = () => {
    onClose();
    navigate("/products", {
      state: {
        visualSearchResults: results,
        queryImageUrl: previewUrl,
        queryImageName: selectedImage?.name || "Uploaded image",
      },
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                {t("visualSearch.title", "Search by Image")}
              </h2>
              <p className="text-xs text-slate-500">
                {t("visualSearch.subtitle", "Upload an image to discover visually matched products")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={t("common.close", "Close")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* Upload & Scanning Area */}
          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${isDragOver
                ? "border-indigo-600 bg-indigo-50/50 scale-[1.01] shadow-lg shadow-indigo-500/10"
                : "border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20"
                }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {t("visualSearch.dragPrompt", "Drag and drop your image here, or browse")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {t("visualSearch.supports", "Supports JPG, PNG, WEBP files up to 10MB")}
              </p>

              <div className="mt-6 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span>{t("visualSearch.browseFiles", "Browse Files")}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Query Image & Scanning / Results View */
            <div className="space-y-6">
              {/* Top Query Image Preview Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300 shadow-2xs">
                    <img
                      src={previewUrl}
                      alt="Visual Search Target"
                      className="w-full h-full object-cover"
                    />
                    {isSearching && (
                      <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                      {t("visualSearch.queryImage", "Searched Image")}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {selectedImage?.name || "Uploaded Photo"}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isSearching
                        ? t("visualSearch.analyzing", "Analyzing visual features & vectors...")
                        : t("visualSearch.foundMatches", {
                          count: results.length,
                          defaultValue: `Found ${results.length} visual matches`,
                        })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      clearSearch();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    {t("visualSearch.tryAnother", "Upload Another")}
                  </button>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={t("visualSearch.clear", "Clear")}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scanning Laser Animation during processing */}
              {isSearching ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-24 h-24 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse shadow-md shadow-indigo-500" />
                    <svg className="w-10 h-10 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-slate-900">
                      {t("visualSearch.matchingCatalog", "Finding matching catalog products...")}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("visualSearch.similaritySearchInProgress", "Computing high-dimensional vector similarity")}
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-xs font-bold text-rose-700 mt-2">{error}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer"
                  >
                    {t("visualSearch.tryAgain", "Try another image")}
                  </button>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {/* Results Controls Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                        {t("visualSearch.matchedProducts", "Matched Products")} ({results.length})
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                      <span>✨</span>
                      <span>{t("visualSearch.bestMatches", "Best Visual Matches")}</span>
                    </div>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                    {results.map(({ product, similarity }) => (
                      <div key={product.id} onClick={() => onSelectProduct?.(product)}>
                        <ProductCard
                          product={product}
                          similarityScore={similarity}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Explore in Catalog CTA */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {t("visualSearch.viewAllInCatalogPrompt", "Want to filter by category or price?")}
                    </span>
                    <button
                      type="button"
                      onClick={handleExploreInCatalog}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>{t("visualSearch.exploreInCatalog", "Explore in Full Catalog")}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No Matches Found */
                <div className="py-12 text-center">
                  <span className="text-4xl">🔍</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">
                    {t("visualSearch.noMatchesTitle", "No visual matches found")}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {t(
                      "visualSearch.noMatchesDesc",
                      "We couldn't find items closely matching this image in our catalog. Try uploading a different photo."
                    )}
                  </p>
                  <div className="mt-5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        clearSearch();
                        fileInputRef.current?.click();
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 shadow-xs transition-all cursor-pointer flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>{t("visualSearch.uploadAnother", "Upload Another Image")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SearchByImageModal;
