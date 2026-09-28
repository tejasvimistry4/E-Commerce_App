import axiosInstance from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  Review,
  ReviewFilterParams,
  AdminReviewFilterParams,
  ProductReviewsResponse,
  AdminReviewsResponse,
  AdminReviewStatsResponse,
  TopReviewedProductsResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
  UserReviewEligibility,
  ReviewStatus,
} from "../types/review";

/**
 * 1. Fetch approved reviews and aggregated stats for a product
 */
export const getProductReviewsApi = async (
  productId: string,
  params?: ReviewFilterParams
): Promise<ProductReviewsResponse> => {
  const response = await axiosInstance.get<ProductReviewsResponse>(
    API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId),
    { params }
  );
  return response.data;
};

/**
 * 2. Fetch current user review & verified purchase eligibility for a product
 */
export const getUserReviewForProductApi = async (
  productId: string
): Promise<{ success: boolean; data: UserReviewEligibility }> => {
  const response = await axiosInstance.get<{ success: boolean; data: UserReviewEligibility }>(
    API_ENDPOINTS.REVIEWS.MY_REVIEW(productId)
  );
  return response.data;
};

/**
 * 3. Submit a new review
 */
export const createReviewApi = async (
  productId: string,
  data: CreateReviewRequest
): Promise<{ success: boolean; message: string; data: Review }> => {
  const response = await axiosInstance.post<{ success: boolean; message: string; data: Review }>(
    API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId),
    data
  );
  return response.data;
};

/**
 * 4. Update an existing review
 */
export const updateReviewApi = async (
  reviewId: string,
  data: UpdateReviewRequest
): Promise<{ success: boolean; message: string; data: Review }> => {
  const response = await axiosInstance.put<{ success: boolean; message: string; data: Review }>(
    API_ENDPOINTS.REVIEWS.BY_ID(reviewId),
    data
  );
  return response.data;
};

/**
 * 5. Delete review (by author)
 */
export const deleteReviewApi = async (
  reviewId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.delete<{ success: boolean; message: string }>(
    API_ENDPOINTS.REVIEWS.BY_ID(reviewId)
  );
  return response.data;
};

/**
 * 6. Admin: Get all reviews with filters & pagination
 */
export const getAdminReviewsApi = async (
  params?: AdminReviewFilterParams
): Promise<AdminReviewsResponse> => {
  const response = await axiosInstance.get<AdminReviewsResponse>(
    API_ENDPOINTS.REVIEWS.ADMIN_ALL,
    { params }
  );
  return response.data;
};

/**
 * 8. Admin: Get overview stats
 */
export const getAdminReviewStatsApi = async (): Promise<AdminReviewStatsResponse> => {
  const response = await axiosInstance.get<AdminReviewStatsResponse>(
    API_ENDPOINTS.REVIEWS.ADMIN_STATS
  );
  return response.data;
};

/**
 * 9. Admin: Update review status (Approved / Pending / Rejected)
 */
export const updateAdminReviewStatusApi = async (
  reviewId: string,
  status: ReviewStatus
): Promise<{ success: boolean; message: string; data: Review }> => {
  const response = await axiosInstance.patch<{ success: boolean; message: string; data: Review }>(
    API_ENDPOINTS.REVIEWS.ADMIN_STATUS(reviewId),
    { status }
  );
  return response.data;
};

/**
 * 10. Admin: Delete review permanently
 */
export const deleteAdminReviewApi = async (
  reviewId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.delete<{ success: boolean; message: string }>(
    API_ENDPOINTS.REVIEWS.ADMIN_BY_ID(reviewId)
  );
  return response.data;
};

/**
 * 11. Fetch top reviewed products ranked by total review count in descending order
 */
export const getTopReviewedProductsApi = async (
  limit = 5
): Promise<TopReviewedProductsResponse> => {
  const response = await axiosInstance.get<TopReviewedProductsResponse>(
    API_ENDPOINTS.REVIEWS.ADMIN_TOP_PRODUCTS,
    { params: { limit } }
  );
  return response.data;
};
