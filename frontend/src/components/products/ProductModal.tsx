import React, { useState, useEffect } from "react";
import { Product, CreateProductPayload, UpdateProductPayload, CreateProductVariantPayload } from "../../types/product";
import { Category } from "../../types/category";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { createProduct, updateProduct } from "../../redux/products/productSlice";
import { Modal, Button, Input, Textarea, Select, Icon } from "../common";
import { handleSingleImageFileUpload, getImageUrl } from "../../utils/image.utils";
import { toast } from "react-toastify";
import { MESSAGES } from "../../constants/messages";
import { useTranslation } from "react-i18next";

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
}

interface VariantFormItem {
  id?: string;
  sku?: string;
  price: string | number;
  comparePrice?: string | number;
  stock: string | number;
  images: string[];
  thumbnail?: string;
  attributes: Record<string, string>;
  isActive: boolean;
  isDefault?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.products);

  const [activeTab, setActiveTab] = useState<"general" | "variants">("general");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState<string | number>("");
  const [comparePrice, setComparePrice] = useState<string | number>("");
  const [stock, setStock] = useState<string | number>("0");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Product Variants state
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<VariantFormItem[]>([]);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("general");
      if (productToEdit) {
        setName(productToEdit.name || "");
        setSlug(productToEdit.slug || "");
        setCategoryId(productToEdit.categoryId || "");
        setPrice(productToEdit.price ?? "");
        setComparePrice(productToEdit.comparePrice ?? "");
        setStock(productToEdit.stock ?? 0);
        setSku(productToEdit.sku || "");
        setDescription(productToEdit.description || "");
        setImages(productToEdit.images || []);
        setThumbnail(productToEdit.thumbnail || (productToEdit.images?.[0] || ""));
        setIsActive(productToEdit.isActive !== undefined ? productToEdit.isActive : true);
        setIsFeatured(Boolean(productToEdit.isFeatured));

        if (productToEdit.variants && productToEdit.variants.length > 0) {
          setHasVariants(true);
          setVariantsList(
            productToEdit.variants.map((v) => ({
              id: v.id,
              sku: v.sku || "",
              price: v.price ?? productToEdit.price,
              comparePrice: v.comparePrice ?? "",
              stock: v.stock ?? 0,
              images: v.images || [],
              thumbnail: v.thumbnail || (v.images?.[0] || ""),
              attributes: v.attributes || {},
              isActive: v.isActive ?? true,
              isDefault: Boolean(v.isDefault),
            }))
          );
        } else {
          setHasVariants(false);
          setVariantsList([]);
        }
      } else {
        setName("");
        setSlug("");
        setCategoryId(categories.length > 0 ? categories[0].id : "");
        setPrice("");
        setComparePrice("");
        setStock("10");
        setSku("");
        setDescription("");
        setImages([]);
        setThumbnail("");
        setIsActive(true);
        setIsFeatured(false);
        setHasVariants(false);
        setVariantsList([]);
      }
    }
  }, [isOpen, productToEdit, categories]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!productToEdit) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (images.length >= 8) {
      toast.warning(t("products.maxImagesWarning", { defaultValue: "You can upload a maximum of 8 images per product." }));
      return;
    }
    await handleSingleImageFileUpload(e, {
      onSuccess: (uploadedUrl) => {
        if (uploadedUrl) {
          setImages((prev) => {
            const updated = [...prev, uploadedUrl];
            if (!thumbnail) {
              setThumbnail(uploadedUrl);
            }
            return updated;
          });
        }
      },
      setUploading: setUploadingImage,
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (thumbnail === prev[indexToRemove]) {
        setThumbnail(updated[0] || "");
      }
      return updated;
    });
  };

  // Variant Management Handlers
  const handleEnableVariants = (enabled: boolean) => {
    setHasVariants(enabled);
    if (enabled && variantsList.length === 0) {
      // Auto-generate Variant 1 (Default / Base Product) from general fields
      const baseThumb = thumbnail || (images.length > 0 ? images[0] : "");
      const baseImagesList = images.length > 0 ? [...images] : (baseThumb ? [baseThumb] : []);

      setVariantsList([
        {
          sku: sku ? sku.trim() : "",
          price: price || "",
          comparePrice: comparePrice || "",
          stock: stock || "10",
          images: baseImagesList,
          thumbnail: baseThumb,
          attributes: { Color: "Original", Size: "Standard" },
          isActive: true,
          isDefault: true,
        },
      ]);
    }
  };

  const handleSyncVariant1FromBase = () => {
    const baseThumb = thumbnail || (images.length > 0 ? images[0] : "");
    const baseImagesList = images.length > 0 ? [...images] : (baseThumb ? [baseThumb] : []);

    setVariantsList((prev) => {
      if (prev.length === 0) {
        return [
          {
            sku: sku ? sku.trim() : "",
            price: price || "",
            comparePrice: comparePrice || "",
            stock: stock || "10",
            images: baseImagesList,
            thumbnail: baseThumb,
            attributes: { Color: "Original", Size: "Standard" },
            isActive: true,
            isDefault: true,
          },
        ];
      }
      return prev.map((item, idx) => {
        if (idx === 0) {
          return {
            ...item,
            sku: sku ? sku.trim() : item.sku,
            price: price || item.price,
            comparePrice: comparePrice || item.comparePrice,
            stock: stock || item.stock,
            images: baseImagesList.length > 0 ? baseImagesList : item.images,
            thumbnail: baseThumb || item.thumbnail,
            isDefault: true,
          };
        }
        return item;
      });
    });
    toast.success(t("messages.products.syncedVariant1", { defaultValue: "Variant 1 synced with Base Product details!" }));
  };

  const handleAddVariant = () => {
    if (variantsList.length === 0) {
      handleEnableVariants(true);
      return;
    }

    const variantNumber = variantsList.length + 1;
    setVariantsList((prev) => [
      ...prev,
      {
        sku: sku ? `${sku}-V${variantNumber}` : "",
        price: price || "",
        stock: "10",
        images: [],
        thumbnail: "",
        attributes: { Color: "", Size: "" },
        isActive: true,
        isDefault: false,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (index === 0) {
      toast.warning(t("messages.products.cannotDeleteVariant1", { defaultValue: "Variant 1 is the Base / Default Product and cannot be deleted. You can edit its attributes or disable variants." }));
      return;
    }
    setVariantsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateVariant = (index: number, updates: Partial<VariantFormItem>) => {
    setVariantsList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleUpdateVariantAttribute = (variantIndex: number, attrKey: string, attrVal: string) => {
    setVariantsList((prev) =>
      prev.map((item, idx) => {
        if (idx !== variantIndex) return item;
        return {
          ...item,
          attributes: {
            ...item.attributes,
            [attrKey]: attrVal,
          },
        };
      })
    );
  };

  const handleVariantImageUpload = async (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingVariantIndex(variantIndex);
    await handleSingleImageFileUpload(e, {
      onSuccess: (uploadedUrl) => {
        if (uploadedUrl) {
          setVariantsList((prev) =>
            prev.map((item, idx) => {
              if (idx !== variantIndex) return item;
              const updatedImages = [...item.images, uploadedUrl];
              return {
                ...item,
                images: updatedImages,
                thumbnail: item.thumbnail || uploadedUrl,
              };
            })
          );
        }
      },
      setUploading: (uploading) => {
        if (!uploading) setUploadingVariantIndex(null);
      },
    });
  };

  const handleRemoveVariantImage = (variantIndex: number, imgIndex: number) => {
    setVariantsList((prev) =>
      prev.map((item, idx) => {
        if (idx !== variantIndex) return item;
        const updatedImages = item.images.filter((_, i) => i !== imgIndex);
        return {
          ...item,
          images: updatedImages,
          thumbnail: item.thumbnail === item.images[imgIndex] ? updatedImages[0] || "" : item.thumbnail,
        };
      })
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!name.trim()) {
      toast.error(t("products.titleRequired", { defaultValue: "Product title is required." }));
      return;
    }

    if (!categoryId) {
      toast.error(t("products.categoryRequired", { defaultValue: "Please select a valid product category." }));
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error(t("products.priceRequired", { defaultValue: "Please enter a valid product price." }));
      return;
    }

    const numericStock = Number(stock);
    if (isNaN(numericStock) || numericStock < 0) {
      toast.error(t("products.stockRequired", { defaultValue: "Please enter a valid non-negative inventory stock quantity." }));
      return;
    }

    const numericComparePrice = comparePrice ? Number(comparePrice) : null;
    if (numericComparePrice !== null && (isNaN(numericComparePrice) || numericComparePrice < 0)) {
      toast.error(t("products.comparePriceInvalid", { defaultValue: "Please enter a valid compare price." }));
      return;
    }

    // Process variant payloads if variants are enabled
    let formattedVariants: CreateProductVariantPayload[] | undefined = undefined;
    if (hasVariants && variantsList.length > 0) {
      formattedVariants = variantsList.map((v) => ({
        id: v.id,
        sku: v.sku ? v.sku.trim() : null,
        price: Number(v.price) || numericPrice,
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        stock: Number(v.stock) || 0,
        images: v.images || [],
        thumbnail: v.thumbnail || (v.images?.[0] || null),
        attributes: v.attributes || {},
        isActive: v.isActive,
        isDefault: v.isDefault,
      }));
    }

    const mainThumb = thumbnail || (images.length > 0 ? images[0] : null);

    try {
      if (productToEdit) {
        const payload: UpdateProductPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          categoryId,
          price: numericPrice,
          comparePrice: numericComparePrice,
          stock: numericStock,
          sku: sku.trim() || null,
          description: description.trim() || null,
          images: images.length > 0 ? images : [],
          thumbnail: mainThumb,
          isActive,
          isFeatured,
          variants: formattedVariants,
        };

        await dispatch(updateProduct({ id: productToEdit.id, payload })).unwrap();
        toast.success(t("messages.products.updated", { name: name.trim(), defaultValue: MESSAGES.PRODUCTS.UPDATED(name.trim()) }));
      } else {
        const payload: CreateProductPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          categoryId,
          price: numericPrice,
          comparePrice: numericComparePrice,
          stock: numericStock,
          sku: sku.trim() || null,
          description: description.trim() || null,
          images: images.length > 0 ? images : [],
          thumbnail: mainThumb,
          isActive,
          isFeatured,
          variants: formattedVariants,
        };

        await dispatch(createProduct(payload)).unwrap();
        toast.success(t("messages.products.created", { name: name.trim(), defaultValue: MESSAGES.PRODUCTS.CREATED(name.trim()) }));
      }
      onClose();
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: "Failed to save product." })));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      isLoading={actionLoading}
      badge={
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
          {productToEdit
            ? t("admin.productManagement", { defaultValue: "Product Catalog Management" })
            : t("admin.newProduct", { defaultValue: "New Catalog Product" })}
        </span>
      }
      title={
        productToEdit
          ? t("admin.editProduct", { defaultValue: "Edit Product" })
          : t("admin.addNewProduct", { defaultValue: "Add New Product" })
      }
      subtitle={
        productToEdit
          ? t("admin.editProductSubtitle", {
            defaultValue: "Update product catalog details, pricing, inventory stock, and variation options.",
          })
          : t("admin.createProductSubtitle", {
            defaultValue: "Create a new product item or multi-variant listing in your storefront catalog.",
          })
      }
      bodyClassName="p-6"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={actionLoading}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={actionLoading}
            disabled={uploadingImage}
          >
            {productToEdit
              ? t("common.saveChanges", { defaultValue: "Save Changes" })
              : t("admin.createProduct", { defaultValue: "Create Product" })}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${activeTab === "general"
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 border border-transparent"
              }`}
          >
            <Icon name="package" className="w-3.5 h-3.5" />
            <span>{t("admin.generalDetails", { defaultValue: "General Details" })}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("variants")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${activeTab === "variants"
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 border border-transparent"
              }`}
          >
            <Icon name="layers" className="w-3.5 h-3.5" />
            <span>{t("products.variants", { defaultValue: "Product Variants" })}</span>
            {hasVariants && variantsList.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-indigo-200/80 text-indigo-800">
                {variantsList.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: General Details */}
        {activeTab === "general" && (
          <div className="space-y-5">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("admin.productTitle", { defaultValue: "Product Title" })}
                required
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Classic Organic T-Shirt"
                size="sm"
              />

              <Input
                label={t("products.urlSlug", { defaultValue: "URL Slug" })}
                optional
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. classic-organic-t-shirt"
                size="sm"
              />
            </div>

            {/* Category & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t("admin.category", { defaultValue: "Category" })}
                required
                size="sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                fullWidth
              >
                <option value="">{t("admin.selectCategory", { defaultValue: "-- Select Category --" })}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>

              <Input
                label={t("products.sku", { defaultValue: "Base SKU (Stock Keeping Unit)" })}
                optional
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. TSHIRT-ORG-01"
                size="sm"
              />
            </div>

            {/* Price, Compare Price, Inventory Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t("admin.price", { defaultValue: "Price (₹)" })}
                required
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="999.00"
                size="sm"
              />

              <Input
                label={t("admin.comparePrice", { defaultValue: "Compare Price (₹)" })}
                optional
                type="number"
                step="0.01"
                min="0"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                placeholder="1499.00"
                size="sm"
              />

              <Input
                label={t("admin.stock", { defaultValue: "Base Inventory Stock" })}
                required
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                size="sm"
              />
            </div>

            {/* Description */}
            <Textarea
              label={t("common.description", { defaultValue: "Description" })}
              optional
              rows={3}
              size="sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("products.descriptionPlaceholder", {
                defaultValue: "Detailed specifications, features, material composition, and care instructions...",
              })}
            />

            {/* Base Product Images */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t("admin.productImages", { defaultValue: "Base Product Images" })}
                </label>
                <span className="text-xs font-semibold text-slate-400">
                  {images.length}/8 {t("common.uploaded", { defaultValue: "uploaded" })}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`group relative aspect-square rounded-2xl bg-white border-2 overflow-hidden shadow-2xs flex items-center justify-center ${thumbnail === imgUrl ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-slate-200"
                      }`}
                  >
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {thumbnail === imgUrl && (
                      <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white rounded-full p-0.5 shadow-xs">
                        <Icon name="check-circle" className="w-3 h-3" />
                      </span>
                    )}

                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                      <button
                        type="button"
                        onClick={() => setThumbnail(imgUrl)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-900 hover:bg-indigo-50 cursor-pointer shadow-xs"
                      >
                        {t("admin.mainThumbnail", { defaultValue: "Main" })}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                        aria-label="Remove image"
                      >
                        <Icon name="close" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < 8 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer group">
                    <Icon name="upload-cloud" className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 mb-1" />
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-indigo-600">
                      {uploadingImage ? t("common.uploading", { defaultValue: "Uploading..." }) : t("common.upload", { defaultValue: "Upload" })}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Status Switches Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Active Status Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {t("common.activeStatus", { defaultValue: "Active for Sale" })}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {t("products.activeStatusDesc", { defaultValue: "Visible and purchasable in store catalog." })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${isActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  aria-label="Toggle active status"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              {/* Featured Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    ★ {t("home.featured", { defaultValue: "Featured Showcase" })}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {t("products.featuredStatusDesc", { defaultValue: "Promote on homepage featured carousels." })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${isFeatured ? "bg-pink-500" : "bg-slate-300"
                    }`}
                  aria-label="Toggle featured status"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isFeatured ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Product Variants */}
        {activeTab === "variants" && (
          <div className="space-y-5">
            {/* Variation Enable Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                  {t("products.variantConfig", { defaultValue: "Product Variations Configuration" })}
                </h4>
                <p className="text-xs text-indigo-700/80 mt-0.5">
                  {t("products.variantConfigDesc", {
                    defaultValue: "Configure options (Size, Color, Material) with independent prices, stock, SKU & gallery images.",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                <span className="text-xs font-bold text-indigo-950">
                  {t("products.enableVariants", { defaultValue: "Enable Variants" })}
                </span>
                <button
                  type="button"
                  onClick={() => handleEnableVariants(!hasVariants)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${hasVariants ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  aria-label="Toggle enable variants"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasVariants ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>

            {hasVariants && (
              <div className="space-y-4">
                {variantsList.map((vItem, vIdx) => {
                  const isBaseVariant = vIdx === 0;

                  return (
                    <div
                      key={vIdx}
                      className={`p-4 sm:p-5 rounded-2xl bg-white border shadow-xs space-y-4 relative transition-all ${isBaseVariant
                        ? "border-emerald-300 ring-1 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      {/* Variant Header & Actions */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg text-white text-xs font-black flex items-center justify-center ${isBaseVariant ? "bg-emerald-600" : "bg-indigo-600"
                              }`}
                          >
                            {vIdx + 1}
                          </span>
                          <h5 className="text-xs font-black text-slate-900">
                            {isBaseVariant
                              ? t("products.variant1DefaultBase", { defaultValue: "Variant 1 (Default / Base Product)" })
                              : `${t("products.variant", { defaultValue: "Variant" })} ${vIdx + 1}`}
                          </h5>
                          {isBaseVariant ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {t("products.baseProduct", { defaultValue: "Base Product" })}
                            </span>
                          ) : (
                            vItem.isDefault && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                                {t("products.default", { defaultValue: "Default" })}
                              </span>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isBaseVariant ? (
                            <button
                              type="button"
                              onClick={handleSyncVariant1FromBase}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-200/60"
                              title="Sync price, stock, SKU and images from General Details tab"
                            >
                              <Icon name="refresh" className="w-3 h-3" />
                              <span>{t("products.syncBaseDetails", { defaultValue: "Sync Base Details" })}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setVariantsList((prev) =>
                                    prev.map((item, idx) => ({
                                      ...item,
                                      isDefault: idx === vIdx,
                                    }))
                                  )
                                }
                                className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {t("products.makeDefault", { defaultValue: "Make Default" })}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(vIdx)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={`Remove Variant ${vIdx + 1}`}
                                aria-label={`Remove Variant ${vIdx + 1}`}
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Attributes Row (Color, Size, Material) */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {t("products.attributes", { defaultValue: "Attributes (Color, Size, Material)" })}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            label={t("products.color", { defaultValue: "Color" })}
                            size="sm"
                            value={vItem.attributes["Color"] || ""}
                            onChange={(e) =>
                              handleUpdateVariantAttribute(vIdx, "Color", e.target.value)
                            }
                            placeholder="e.g. Black"
                          />
                          <Input
                            label={t("products.size", { defaultValue: "Size" })}
                            size="sm"
                            value={vItem.attributes["Size"] || ""}
                            onChange={(e) =>
                              handleUpdateVariantAttribute(vIdx, "Size", e.target.value)
                            }
                            placeholder="e.g. M, L, XL"
                          />
                          <Input
                            label={t("products.material", { defaultValue: "Material" })}
                            size="sm"
                            value={vItem.attributes["Material"] || ""}
                            onChange={(e) =>
                              handleUpdateVariantAttribute(vIdx, "Material", e.target.value)
                            }
                            placeholder="e.g. 100% Cotton"
                          />
                        </div>
                      </div>

                      {/* Pricing, Stock, SKU */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Input
                          label={t("admin.price", { defaultValue: "Price (₹)" })}
                          required
                          size="sm"
                          type="number"
                          step="0.01"
                          value={vItem.price}
                          onChange={(e) =>
                            handleUpdateVariant(vIdx, { price: e.target.value })
                          }
                          placeholder="999.00"
                        />

                        <Input
                          label={t("admin.stock", { defaultValue: "Stock Quantity" })}
                          required
                          size="sm"
                          type="number"
                          min="0"
                          value={vItem.stock}
                          onChange={(e) =>
                            handleUpdateVariant(vIdx, { stock: e.target.value })
                          }
                          placeholder="15"
                        />
                        <Input
                          label={t("products.sku", { defaultValue: "Variant SKU" })}
                          optional
                          size="sm"
                          value={vItem.sku || ""}
                          onChange={(e) =>
                            handleUpdateVariant(vIdx, { sku: e.target.value })
                          }
                          placeholder="TSHIRT-BLK-M"
                        />
                      </div>

                      {/* Variant Gallery Images */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <label className="block text-[11px] font-bold text-slate-600">
                          {t("products.variantImages", { defaultValue: "Variant Images" })} ({vItem.images.length})
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {vItem.images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              className={`group relative w-14 h-14 rounded-xl border-2 overflow-hidden bg-slate-100 shrink-0 ${vItem.thumbnail === imgUrl ? "border-indigo-600 ring-1 ring-indigo-600" : "border-slate-200"
                                }`}
                            >
                              <img
                                src={getImageUrl(imgUrl)}
                                alt={`Variant ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantImage(vIdx, imgIdx)}
                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                aria-label="Remove variant image"
                              >
                                <Icon name="close" className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <label className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-600 bg-slate-50 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer shrink-0">
                            <Icon name="upload-cloud" className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleVariantImageUpload(vIdx, e)}
                              disabled={uploadingVariantIndex === vIdx}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                  className="w-full !rounded-2xl border-dashed py-3 flex items-center justify-center gap-2 font-bold"
                  icon={<Icon name="plus" className="w-4 h-4" />}
                >
                  {t("products.addAdditionalVariant", {
                    defaultValue: `+ Add Additional Variant (Variant ${variantsList.length + 1})`,
                  })}
                </Button>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ProductModal;
