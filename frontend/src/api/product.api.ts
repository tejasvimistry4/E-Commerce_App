import { api } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  ProductCategory,
  Product,
  ProductPagination,
  ProductListResponse,
  ProductSingleResponse,
  AdminProductsResponse,
  CreateProductPayload,
  UpdateProductPayload,
  ProductFilterParams,
} from "../types/product";

export type {
  ProductCategory,
  Product,
  ProductPagination,
  ProductListResponse,
  ProductSingleResponse,
  AdminProductsResponse,
  CreateProductPayload,
  UpdateProductPayload,
  ProductFilterParams,
};

// 1. Get filtered products for Customer Storefront
export const getProductsApi = async (
  params?: ProductFilterParams
): Promise<ProductListResponse> => {
  const response = await api.get<ProductListResponse>(
    API_ENDPOINTS.PRODUCTS.BASE,
    { params }
  );
  return response.data;
};

// 2. Get featured products
export const getFeaturedProductsApi = async (
  limit = 8
): Promise<{ success: boolean; data: Product[] }> => {
  const response = await api.get<{ success: boolean; data: Product[] }>(
    API_ENDPOINTS.PRODUCTS.FEATURED,
    { params: { limit } }
  );
  return response.data;
};

// 3. Get product by slug (with related products)
export const getProductBySlugApi = async (
  slug: string
): Promise<ProductSingleResponse> => {
  const response = await api.get<ProductSingleResponse>(
    API_ENDPOINTS.PRODUCTS.SLUG(slug)
  );
  return response.data;
};

// 4. Get product by ID
export const getProductByIdApi = async (
  id: string
): Promise<ProductSingleResponse> => {
  const response = await api.get<ProductSingleResponse>(
    API_ENDPOINTS.PRODUCTS.BY_ID(id)
  );
  return response.data;
};

// 5. Get all products (Admin Only)
export const getAdminProductsApi = async (params?: {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}): Promise<AdminProductsResponse> => {
  const response = await api.get<AdminProductsResponse>(
    API_ENDPOINTS.PRODUCTS.ADMIN_ALL,
    { params }
  );
  return response.data;
};

// 6. Create product (Admin Only)
export const createProductApi = async (
  payload: CreateProductPayload
): Promise<ProductSingleResponse> => {
  const response = await api.post<ProductSingleResponse>(
    API_ENDPOINTS.PRODUCTS.BASE,
    payload
  );
  return response.data;
};

// 7. Update product (Admin Only)
export const updateProductApi = async (
  id: string,
  payload: UpdateProductPayload
): Promise<ProductSingleResponse> => {
  const response = await api.put<ProductSingleResponse>(
    API_ENDPOINTS.PRODUCTS.BY_ID(id),
    payload
  );
  return response.data;
};

// 8. Toggle product status (Admin Only)
export const toggleProductStatusApi = async (
  id: string
): Promise<ProductSingleResponse> => {
  const response = await api.patch<ProductSingleResponse>(
    API_ENDPOINTS.PRODUCTS.STATUS(id)
  );
  return response.data;
};

// 9. Delete product (Admin Only)
export const deleteProductApi = async (
  id: string
): Promise<{ success: boolean; message: string; data: { id: string } }> => {
  const response = await api.delete<{
    success: boolean;
    message: string;
    data: { id: string };
  }>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  return response.data;
};

// 10. Search products by uploading an image (Visual Search)
export const searchProductsByImageApi = async (
  formData: FormData,
  params?: {
    limit?: number;
    threshold?: number;
    categoryId?: string;
    categorySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
  }
) => {
  const response = await api.post(
    API_ENDPOINTS.PRODUCTS.VISUAL_SEARCH,
    formData,
    {
      params,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// 11. Sync Product Embeddings (Admin Only)
export const syncProductEmbeddingsApi = async () => {
  const response = await api.post(API_ENDPOINTS.PRODUCTS.SYNC_EMBEDDINGS);
  return response.data;
};

// 12. Get Product Variants
export const getProductVariantsApi = async (productId: string) => {
  const response = await api.get(API_ENDPOINTS.PRODUCTS.VARIANTS(productId));
  return response.data;
};

// 13. Create Product Variant (Admin Only)
export const createVariantApi = async (productId: string, payload: any) => {
  const response = await api.post(API_ENDPOINTS.PRODUCTS.VARIANTS(productId), payload);
  return response.data;
};

// 14. Update Product Variant (Admin Only)
export const updateVariantApi = async (variantId: string, payload: any) => {
  const response = await api.put(API_ENDPOINTS.PRODUCTS.VARIANT_BY_ID(variantId), payload);
  return response.data;
};

// 15. Delete Product Variant (Admin Only)
export const deleteVariantApi = async (variantId: string) => {
  const response = await api.delete(API_ENDPOINTS.PRODUCTS.VARIANT_BY_ID(variantId));
  return response.data;
};


