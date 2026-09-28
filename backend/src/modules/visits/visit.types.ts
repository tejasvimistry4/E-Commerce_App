export interface TrackVisitResponse {
  success: boolean;
  message: string;
  isGenuineVisit: boolean;
  visitCount: number;
  isHighlyInterested: boolean;
  lastVisitedAt: Date | string;
  firstVisitedAt?: Date | string;
  cooldownRemainingSeconds?: number;
  threshold: number;
}

export interface ProductVisitStatusResponse {
  success: boolean;
  hasVisited: boolean;
  visitCount: number;
  isHighlyInterested: boolean;
  firstVisitedAt: Date | string | null;
  lastVisitedAt: Date | string | null;
  threshold: number;
}

export interface HighlyInterestedProductItem {
  id: string;
  userId: string;
  productId: string;
  visitCount: number;
  isHighlyInterested: boolean;
  firstVisitedAt: Date | string;
  lastVisitedAt: Date | string;
  visitTimestamps?: Array<Date | string>;
  product: {
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
    category?: {
      id: string;
      name: string;
      slug: string;
    };
    variants?: Array<{
      id: string;
      sku: string | null;
      price: number;
      comparePrice: number | null;
      stock: number;
      images: string[];
      thumbnail: string | null;
      attributes: Record<string, string>;
      isActive: boolean;
    }>;
  };
}

export interface HighlyInterestedListResponse {
  success: boolean;
  totalItems: number;
  items: HighlyInterestedProductItem[];
}

export interface RecentVisitsListResponse {
  success: boolean;
  totalItems: number;
  items: HighlyInterestedProductItem[];
}

// --- Admin Types ---

export interface AdminProductVisitItem {
  id: string;
  userId: string;
  productId: string;
  visitCount: number;
  isHighlyInterested: boolean;
  firstVisitedAt: Date | string;
  lastVisitedAt: Date | string;
  visitTimestamps: Array<Date | string>;
  createdAt: Date | string;
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
  latestVisitAt: Date | string;
  firstVisitAt: Date | string;
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
