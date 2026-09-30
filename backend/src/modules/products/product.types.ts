export interface ProductVariantDto {
  id: string;
  productId: string;
  sku?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  lowStockThreshold?: number | null;
  images: string[];
  thumbnail?: string | null;
  attributes: Record<string, string>;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductVariantDto {
  id?: string;
  sku?: string | null;
  price: number;
  comparePrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  images?: string[];
  thumbnail?: string | null;
  attributes: Record<string, string>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateProductVariantDto {
  id?: string;
  sku?: string | null;
  price?: number;
  comparePrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  images?: string[];
  thumbnail?: string | null;
  attributes?: Record<string, string>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  sku?: string | null;
  images?: string[];
  thumbnail?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId: string;
  vendorId?: string | null;
  variants?: CreateProductVariantDto[];
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number;
  comparePrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  sku?: string | null;
  images?: string[];
  thumbnail?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  variants?: UpdateProductVariantDto[];
}

export interface ProductQueryFilters {
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
  isActive?: boolean;
  isFeatured?: boolean;
  inStockOnly?: boolean;
  color?: string;
  size?: string;
  material?: string;
  attributes?: Record<string, string | string[]>;
  vendorId?: string | null;
  sortBy?: "price" | "createdAt" | "name" | "stock" | "rating" | "discount" | "popularity";
  sortOrder?: "asc" | "desc";
}

export interface FacetCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface FacetBrand {
  name: string;
  count: number;
}

export interface FacetAttribute {
  name: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

export interface SearchFacetsResponse {
  total: number;
  priceRange: {
    min: number;
    max: number;
  };
  categories: FacetCategory[];
  brands: FacetBrand[];
  attributes: FacetAttribute[];
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  discountCounts: {
    tenOrMore: number;
    twentyOrMore: number;
    thirtyOrMore: number;
    fiftyOrMore: number;
  };
}

export interface SuggestionProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  thumbnail?: string | null;
  categoryName?: string;
  averageRating: number;
  stock: number;
}

export interface SearchSuggestionsResponse {
  query: string;
  didYouMean?: string | null;
  products: SuggestionProductItem[];
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: string[];
  popularSearches: string[];
}

