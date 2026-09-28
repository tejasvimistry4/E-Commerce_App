export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

export interface ReviewProduct {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string | null;
  price: number;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  images: string[];
  status: ReviewStatus;
  userId: string;
  productId: string;
  user?: ReviewUser;
  product?: ReviewProduct;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  recommendedPercentage: number;
  ratingBreakdown: ReviewRatingBreakdown;
}

export interface CreateReviewRequest {
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewFilterParams {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  hasImages?: boolean;
}

export interface AdminReviewFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus;
  rating?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  productId?: string;
  userId?: string;
  topProductsOnly?: boolean;
}

export interface TopReviewedProduct {
  rank: number;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    stock: number;
    category?: { id: string; name: string } | null;
  } | null;
  totalReviews: number;
  averageRating: number;
}

export interface UserReviewEligibility {
  canReview: boolean;
  existingReview: Review | null;
}

export interface ProductReviewsResponse {
  success: boolean;
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
  };
}

export interface AdminReviewsResponse {
  success: boolean;
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminReviewStatsResponse {
  success: boolean;
  data: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    averageRating: number;
    fiveStarRatio: number;
  };
}

export interface TopReviewedProductsResponse {
  success: boolean;
  data: TopReviewedProduct[];
}
