import {
  getProductsApi,
  getFeaturedProductsApi,
  getProductBySlugApi,
  getProductByIdApi,
  getAdminProductsApi,
  createProductApi,
  updateProductApi,
  toggleProductStatusApi,
  deleteProductApi,
  searchProductsByImageApi,
  syncProductEmbeddingsApi,
} from "../api/product.api";
import {
  ProductFilterParams,
  CreateProductPayload,
  UpdateProductPayload,
  ProductListResponse,
  ProductSingleResponse,
  AdminProductsResponse,
} from "../types/product";
import { VisualSearchOptions, VisualSearchResponse } from "../types/visualSearch";

export class ProductService {
  static async getProducts(params?: ProductFilterParams): Promise<ProductListResponse> {
    return getProductsApi(params);
  }

  static async getFeaturedProducts(limit = 8) {
    return getFeaturedProductsApi(limit);
  }

  static async getProductBySlug(slug: string): Promise<ProductSingleResponse> {
    return getProductBySlugApi(slug);
  }

  static async getProductById(id: string): Promise<ProductSingleResponse> {
    return getProductByIdApi(id);
  }

  static async getAdminProducts(params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  }): Promise<AdminProductsResponse> {
    return getAdminProductsApi(params);
  }

  static async createProduct(payload: CreateProductPayload): Promise<ProductSingleResponse> {
    return createProductApi(payload);
  }

  static async updateProduct(id: string, payload: UpdateProductPayload): Promise<ProductSingleResponse> {
    return updateProductApi(id, payload);
  }

  static async toggleProductStatus(id: string): Promise<ProductSingleResponse> {
    return toggleProductStatusApi(id);
  }

  static async deleteProduct(id: string) {
    return deleteProductApi(id);
  }

  static async searchByImage(
    file: File | Blob,
    options?: VisualSearchOptions
  ): Promise<VisualSearchResponse> {
    const formData = new FormData();
    formData.append("image", file);
    return searchProductsByImageApi(formData, options);
  }

  static async syncEmbeddings(): Promise<{ success: boolean; message: string; data: any }> {
    return syncProductEmbeddingsApi();
  }
}

export default ProductService;

