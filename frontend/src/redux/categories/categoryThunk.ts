import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  getCategoriesApi,
  getCategoryTreeApi,
  getAdminCategoriesApi,
  getCategoryBySlugApi,
  createCategoryApi,
  updateCategoryApi,
  toggleCategoryStatusApi,
  deleteCategoryApi,
} from "../../api/category.api";

// 1. Fetch categories for User Storefront
export const fetchCategories = createAsyncThunk<
  Category[],
  { search?: string; rootOnly?: boolean } | undefined,
  { rejectValue: string }
>("categories/fetchCategories", async (params, { rejectWithValue }) => {
  try {
    const res = await getCategoriesApi(params);
    return res.data.categories;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to load categories";
    return rejectWithValue(message);
  }
});

// 2. Fetch category tree
export const fetchCategoryTree = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>("categories/fetchCategoryTree", async (_, { rejectWithValue }) => {
  try {
    const res = await getCategoryTreeApi();
    return res.data.categories;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to load category tree";
    return rejectWithValue(message);
  }
});

// 3. Fetch all categories for Admin (includes inactive & children count)
export const fetchAdminCategories = createAsyncThunk<
  Category[],
  { search?: string; rootOnly?: boolean; isActive?: boolean } | undefined,
  { rejectValue: string }
>("categories/fetchAdminCategories", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminCategoriesApi(params);
    return res.data.categories;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to load admin categories";
    return rejectWithValue(message);
  }
});

// 4. Fetch single category by slug
export const fetchCategoryBySlug = createAsyncThunk<
  Category,
  string,
  { rejectValue: string }
>("categories/fetchCategoryBySlug", async (slug, { rejectWithValue }) => {
  try {
    const res = await getCategoryBySlugApi(slug);
    return res.data.category;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Category not found";
    return rejectWithValue(message);
  }
});

// 5. Create category (Admin)
export const createCategory = createAsyncThunk<
  Category,
  CreateCategoryPayload,
  { rejectValue: string }
>("categories/createCategory", async (payload, { rejectWithValue }) => {
  try {
    const res = await createCategoryApi(payload);
    return res.data.category;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      "Failed to create category";
    return rejectWithValue(message);
  }
});

// 6. Update category (Admin)
export const updateCategory = createAsyncThunk<
  Category,
  { id: string; payload: UpdateCategoryPayload },
  { rejectValue: string }
>("categories/updateCategory", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await updateCategoryApi(id, payload);
    return res.data.category;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      "Failed to update category";
    return rejectWithValue(message);
  }
});

// 7. Toggle category status (Admin)
export const toggleCategoryStatus = createAsyncThunk<
  Category,
  string,
  { rejectValue: string }
>("categories/toggleCategoryStatus", async (id, { rejectWithValue }) => {
  try {
    const res = await toggleCategoryStatusApi(id);
    return res.data.category;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to toggle category status";
    return rejectWithValue(message);
  }
});

// 8. Delete category (Admin)
export const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("categories/deleteCategory", async (id, { rejectWithValue }) => {
  try {
    await deleteCategoryApi(id);
    return id;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to delete category";
    return rejectWithValue(message);
  }
});
