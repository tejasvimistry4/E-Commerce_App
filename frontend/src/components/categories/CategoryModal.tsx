import React, { useState, useEffect } from "react";
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from "../../api/category.api";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { createCategory, updateCategory } from "../../redux/categories/categorySlice";
import { Modal, Button, Input, Textarea, Select, Icon } from "../common";
import { handleSingleImageFileUpload, getImageUrl } from "../../utils/image.utils";
import { toast } from "react-toastify";
import { MESSAGES } from "../../constants/messages";
import { useTranslation } from "react-i18next";

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  existingCategories: Category[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  existingCategories,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.categories);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name || "");
        setSlug(categoryToEdit.slug || "");
        setDescription(categoryToEdit.description || "");
        setParentId(categoryToEdit.parentId || "");
        setImage(categoryToEdit.image || "");
        setIsActive(categoryToEdit.isActive !== undefined ? categoryToEdit.isActive : true);
      } else {
        setName("");
        setSlug("");
        setDescription("");
        setParentId("");
        setImage("");
        setIsActive(true);
      }
    }
  }, [isOpen, categoryToEdit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!categoryToEdit) {
      // Auto-generate slug for new categories
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleSingleImageFileUpload(e, {
      onSuccess: setImage,
      setUploading: setUploadingImage,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("categories.nameRequired", { defaultValue: "Category name is required." }));
      return;
    }

    try {
      if (categoryToEdit) {
        const payload: UpdateCategoryPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          parentId: parentId || null,
          image: image.trim() || undefined,
          isActive,
        };

        await dispatch(updateCategory({ id: categoryToEdit.id, payload })).unwrap();
        toast.success(t("messages.categories.updated", { name: name.trim(), defaultValue: MESSAGES.CATEGORIES.UPDATED(name.trim()) }));
      } else {
        const payload: CreateCategoryPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          parentId: parentId || null,
          image: image.trim() || undefined,
          isActive,
        };

        await dispatch(createCategory(payload)).unwrap();
        toast.success(t("messages.categories.created", { name: name.trim(), defaultValue: MESSAGES.CATEGORIES.CREATED(name.trim()) }));
      }
      onClose();
    } catch (err: any) {
      toast.error(String(err || t("messages.common.genericError", { defaultValue: "Failed to save category." })));
    }
  };

  // Filter available parent candidates (cannot be self)
  const availableParents = existingCategories.filter(
    (c) => !categoryToEdit || c.id !== categoryToEdit.id
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isLoading={actionLoading}
      badge={
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
          {categoryToEdit
            ? t("categories.management", { defaultValue: "Category Management" })
            : t("categories.newCategory", { defaultValue: "New Category" })}
        </span>
      }
      title={
        categoryToEdit
          ? t("categories.editCategory", { defaultValue: "Edit Category" })
          : t("categories.createCategory", { defaultValue: "Create New Category" })
      }
      subtitle={
        categoryToEdit
          ? t("categories.editCategorySubtitle", {
              defaultValue: "Update department metadata, parent hierarchy, or visual thumbnail.",
            })
          : t("categories.createCategorySubtitle", {
              defaultValue: "Add a new department or subcategory to your storefront catalog.",
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
            {categoryToEdit
              ? t("common.saveChanges", { defaultValue: "Save Changes" })
              : t("categories.createCategory", { defaultValue: "Create Category" })}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("categories.categoryName", { defaultValue: "Category Name" })}
            required
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Footwear & Shoes"
            size="sm"
          />

          <Input
            label={t("products.urlSlug", { defaultValue: "URL Slug" })}
            optional
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. footwear-shoes"
            size="sm"
          />
        </div>

        {/* Parent Category Hierarchy */}
        <Select
          label={t("categories.parentCategory", { defaultValue: "Parent Category" })}
          optional
          size="sm"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          fullWidth
        >
          <option value="">{t("categories.noneTopLevel", { defaultValue: "None (Top-Level Root Category)" })}</option>
          {availableParents.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} {cat.parentId ? `— (${t("admin.subcategories", { defaultValue: "Subcategory" })})` : `— (${t("admin.rootDepartment", { defaultValue: "Root" })})`}
            </option>
          ))}
        </Select>

        {/* Description */}
        <Textarea
          label={t("common.description", { defaultValue: "Description" })}
          optional
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("categories.descriptionPlaceholder", {
            defaultValue: "Brief overview of products found under this category...",
          })}
        />

        {/* Category Image Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t("categories.thumbnailImage", { defaultValue: "Category Thumbnail Image" })}
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
              <Icon name="upload-cloud" className="w-4 h-4 text-indigo-600" />
              <span>
                {uploadingImage
                  ? t("common.uploading", { defaultValue: "Uploading..." })
                  : t("common.uploadImage", { defaultValue: "Upload Image" })}
              </span>
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
                placeholder={t("categories.imagePlaceholder", {
                  defaultValue: "Or paste image URL (e.g. /uploads/category.jpg)",
                })}
                size="sm"
              />
            </div>

            {image && (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 group">
                <img
                  src={getImageUrl(image)}
                  alt="Category Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Remove image"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Status Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-900">
              {t("categories.categoryActiveStatus", { defaultValue: "Category Active Status" })}
            </p>
            <p className="text-[11px] text-slate-500">
              {t("categories.categoryActiveStatusDesc", {
                defaultValue: "When inactive, this category and its direct navigation links are hidden from customers.",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
              isActive ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryModal;
