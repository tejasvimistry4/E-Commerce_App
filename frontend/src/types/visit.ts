import { Product } from "./product";

export interface ProductVisitStats {
  hasVisited: boolean;
  visitCount: number;
  isHighlyInterested: boolean;
  firstVisitedAt: string | null;
  lastVisitedAt: string | null;
  threshold: number;
}

export interface ProductVisitStatusResponse extends ProductVisitStats {
  success: boolean;
}

export interface TrackVisitResponse {
  success: boolean;
  message: string;
  isGenuineVisit: boolean;
  visitCount: number;
  isHighlyInterested: boolean;
  lastVisitedAt: string;
  firstVisitedAt?: string;
  cooldownRemainingSeconds?: number;
  threshold: number;
}

export interface HighlyInterestedItem {
  id: string;
  userId: string;
  productId: string;
  visitCount: number;
  isHighlyInterested: boolean;
  firstVisitedAt: string;
  lastVisitedAt: string;
  product: Product;
}

export interface HighlyInterestedListResponse {
  success: boolean;
  totalItems: number;
  items: HighlyInterestedItem[];
}

export interface AdminProductVisitItem {
  id: string;
  userId: string;
  productId: string;
  visitCount: number;
  isHighlyInterested: boolean;
  firstVisitedAt: string;
  lastVisitedAt: string;
  visitTimestamps: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
    sku: string | null;
    thumbnail: string | null;
    images?: string[];
    isActive: boolean;
    categoryId: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

export interface AdminVisitsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminVisitsSummaryStats {
  totalVisitsCount: number;
  totalUniqueUserProductPairs: number;
  totalHighlyInterestedPairs: number;
  conversionRatePercent: number;
  totalUniqueShoppers: number;
  totalProductsTracked: number;
}

export interface AdminVisitsListResponse {
  success: boolean;
  items: AdminProductVisitItem[];
  pagination: AdminVisitsPagination;
  stats: AdminVisitsSummaryStats;
}

export interface AdminRankedProductItem {
  productId: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  thumbnail: string | null;
  isActive: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  totalVisitsCount: number;
  uniqueVisitorsCount: number;
  highlyInterestedUsersCount: number;
  conversionRatePercent: number;
  latestVisitAt: string;
  firstVisitAt: string;
}

export interface AdminRankedProductsResponse {
  success: boolean;
  totalProducts: number;
  items: AdminRankedProductItem[];
  stats: {
    overallVisits: number;
    overallHighlyInterested: number;
    topProduct: {
      name: string;
      visits: number;
    } | null;
  };
}

export interface AdminVisitsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isHighlyInterested?: "all" | "true" | "false";
  sortBy?: "latestVisit" | "firstVisit" | "visitCount" | "userName" | "productName";
  sortOrder?: "asc" | "desc";
  categoryId?: string;
  userId?: string;
  productId?: string;
}

export interface AdminRankedFilterParams {
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: "totalVisits" | "uniqueVisitors" | "highlyInterestedCount" | "latestVisit" | "name" | "price";
  sortOrder?: "asc" | "desc";
}
