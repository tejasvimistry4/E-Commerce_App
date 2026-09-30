import { Product } from "./product";

export interface VisualSearchResult {
  product: Product;
  similarity: number; // 0.0 to 1.0 (e.g. 0.95 = 95% match)
  matchedImage: string;
}

export interface VisualSearchOptions {
  limit?: number;
  threshold?: number;
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export interface VisualSearchResponse {
  success: boolean;
  data: VisualSearchResult[];
  total: number;
  message?: string;
}
