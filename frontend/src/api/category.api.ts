import { api } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResponse,
  CategoryTreeResponse,
  CategorySingleResponse,
} from "../types/category";

export type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResponse,
  CategoryTreeResponse,
  CategorySingleResponse,
};

// 1. Get active categories (Storefront)
export const getCategoriesApi = async (params?: {
  search?: string;
  rootOnly?: boolean;
}): Promise<CategoryListResponse> => {
  const response = await api.get<CategoryListResponse>(
    API_ENDPOINTS.CATEGORIES.BASE,
    { params }
  );
  return response.data;
};

// 2. Get category tree hierarchy (Storefront)
export const getCategoryTreeApi = async (): Promise<CategoryTreeResponse> => {
  const response = await api.get<CategoryTreeResponse>(
    API_ENDPOINTS.CATEGORIES.TREE
  );
  return response.data;
};

// 3. Get all categories including inactive (Admin)
export const getAdminCategoriesApi = async (params?: {
  search?: string;
  rootOnly?: boolean;
  isActive?: boolean;
}): Promise<CategoryListResponse> => {
  const response = await api.get<CategoryListResponse>(
    API_ENDPOINTS.CATEGORIES.ADMIN_ALL,
    { params }
  );
  return response.data;
};

// 4. Get category by Slug
export const getCategoryBySlugApi = async (
  slug: string
): Promise<CategorySingleResponse> => {
  const response = await api.get<CategorySingleResponse>(
    API_ENDPOINTS.CATEGORIES.SLUG(slug)
  );
  return response.data;
};

// 5. Get category by ID
export const getCategoryByIdApi = async (
  id: string
): Promise<CategorySingleResponse> => {
  const response = await api.get<CategorySingleResponse>(
    API_ENDPOINTS.CATEGORIES.BY_ID(id)
  );
  return response.data;
};

// 6. Create Category (Admin)
export const createCategoryApi = async (
  payload: CreateCategoryPayload
): Promise<CategorySingleResponse> => {
  const response = await api.post<CategorySingleResponse>(
    API_ENDPOINTS.CATEGORIES.BASE,
    payload
  );
  return response.data;
};

// 7. Update Category (Admin)
export const updateCategoryApi = async (
  id: string,
  payload: UpdateCategoryPayload
): Promise<CategorySingleResponse> => {
  const response = await api.put<CategorySingleResponse>(
    API_ENDPOINTS.CATEGORIES.BY_ID(id),
    payload
  );
  return response.data;
};

// 8. Toggle Category Active/Inactive (Admin)
export const toggleCategoryStatusApi = async (
  id: string
): Promise<CategorySingleResponse> => {
  const response = await api.patch<CategorySingleResponse>(
    API_ENDPOINTS.CATEGORIES.STATUS(id)
  );
  return response.data;
};

// 9. Delete Category (Admin)
export const deleteCategoryApi = async (
  id: string
): Promise<{ success: boolean; message: string; data: { id: string; name: string } }> => {
  const response = await api.delete<{
    success: boolean;
    message: string;
    data: { id: string; name: string };
  }>(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  return response.data;
};
