export interface GetFacetsParams {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
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

export interface FacetAttributeValue {
  value: string;
  count: number;
}

export interface FacetAttribute {
  name: string;
  values: FacetAttributeValue[];
}

export interface SearchFacets {
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

export interface SuggestionProduct {
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

export interface SearchSuggestions {
  query: string;
  didYouMean?: string | null;
  products: SuggestionProduct[];
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: string[];
  popularSearches: string[];
}

export interface ActiveFilterState {
  search: string;
  categoryId: string;
  brand: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minDiscount?: number;
  inStockOnly: boolean;
  attributes: Record<string, string>;
  sortBy: "createdAt" | "price" | "name" | "rating" | "discount" | "stock";
  sortOrder: "asc" | "desc";
  page: number;
}
