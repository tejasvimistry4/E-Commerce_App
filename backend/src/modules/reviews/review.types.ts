export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewUser {
  id: string;
  name: string;
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
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateReviewDTO {
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface UpdateReviewDTO {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewFilterQuery {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  hasImages?: boolean;
}

export interface AdminReviewFilterQuery {
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

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  recommendedPercentage: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface UserReviewEligibility {
  canReview: boolean;
  existingReview: Review | null;
}
