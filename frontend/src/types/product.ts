export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  images: string[];
  thumbnail?: string | null;
  attributes: Record<string, string>;
  isActive: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  sku: string | null;
  images: string[];
  thumbnail: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  category?: ProductCategory;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: ProductPagination;
  didYouMean?: string | null;
}

export interface ProductSingleResponse {
  success: boolean;
  data: Product;
  relatedProducts?: Product[];
  message?: string;
}

export interface AdminProductsResponse {
  success: boolean;
  data: Product[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
    inStock: number;
    featured: number;
  };
}

export interface CreateProductVariantPayload {
  id?: string;
  sku?: string | null;
  price: number;
  comparePrice?: number | null;
  stock?: number;
  images?: string[];
  thumbnail?: string | null;
  attributes: Record<string, string>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateProductVariantPayload {
  id?: string;
  sku?: string | null;
  price?: number;
  comparePrice?: number | null;
  stock?: number;
  images?: string[];
  thumbnail?: string | null;
  attributes?: Record<string, string>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  stock?: number;
  sku?: string | null;
  images?: string[];
  thumbnail?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId: string;
  variants?: CreateProductVariantPayload[];
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number;
  comparePrice?: number | null;
  stock?: number;
  sku?: string | null;
  images?: string[];
  thumbnail?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  variants?: UpdateProductVariantPayload[];
}

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minDiscount?: number;
  isFeatured?: boolean;
  inStockOnly?: boolean;
  color?: string;
  size?: string;
  material?: string;
  attributes?: Record<string, string | string[]>;
  sortBy?: "price" | "createdAt" | "name" | "stock" | "rating" | "discount" | "popularity";
  sortOrder?: "asc" | "desc";
}

