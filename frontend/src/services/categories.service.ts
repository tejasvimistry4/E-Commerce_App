import {
  getCategoriesApi,
  getCategoryTreeApi,
  getAdminCategoriesApi,
  getCategoryBySlugApi,
  getCategoryByIdApi,
  createCategoryApi,
  updateCategoryApi,
  toggleCategoryStatusApi,
  deleteCategoryApi,
} from "../api/category.api";
import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResponse,
  CategoryTreeResponse,
  CategorySingleResponse,
} from "../types/category";

export class CategoryService {
  static async getCategories(params?: { search?: string; rootOnly?: boolean }): Promise<CategoryListResponse> {
    return getCategoriesApi(params);
  }

  static async getCategoryTree(): Promise<CategoryTreeResponse> {
    return getCategoryTreeApi();
  }

  static async getAdminCategories(params?: {
    search?: string;
    rootOnly?: boolean;
    isActive?: boolean;
  }): Promise<CategoryListResponse> {
    return getAdminCategoriesApi(params);
  }

  static async getBySlug(slug: string): Promise<CategorySingleResponse> {
    return getCategoryBySlugApi(slug);
  }

  static async getById(id: string): Promise<CategorySingleResponse> {
    return getCategoryByIdApi(id);
  }

  static async create(payload: CreateCategoryPayload): Promise<CategorySingleResponse> {
    return createCategoryApi(payload);
  }

  static async update(id: string, payload: UpdateCategoryPayload): Promise<CategorySingleResponse> {
    return updateCategoryApi(id, payload);
  }

  static async toggleStatus(id: string): Promise<CategorySingleResponse> {
    return toggleCategoryStatusApi(id);
  }

  static async delete(id: string) {
    return deleteCategoryApi(id);
  }
}

export default CategoryService;
