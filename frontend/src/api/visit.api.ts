import { api } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  TrackVisitResponse,
  ProductVisitStats,
  ProductVisitStatusResponse,
  HighlyInterestedListResponse,
  AdminVisitsListResponse,
  AdminVisitsFilterParams,
  AdminRankedProductsResponse,
  AdminRankedFilterParams,
} from "../types/visit";

/**
 * 1. Track a visit to a product for the authenticated user
 */
export const trackProductVisitApi = async (
  productId: string
): Promise<TrackVisitResponse> => {
  const response = await api.post<TrackVisitResponse>(
    API_ENDPOINTS.VISITS.TRACK(productId),
    { productId }
  );
  return response.data;
};

/**
 * 2. Get visit status and stats for a specific product
 */
export const getProductVisitStatusApi = async (
  productId: string
): Promise<ProductVisitStatusResponse> => {
  const response = await api.get<ProductVisitStatusResponse>(
    API_ENDPOINTS.VISITS.STATUS(productId)
  );
  return response.data;
};

/**
 * 3. Get all products marked as Highly Interested for authenticated user
 */
export const getHighlyInterestedProductsApi = async (
  limit: number = 50
): Promise<HighlyInterestedListResponse> => {
  const response = await api.get<HighlyInterestedListResponse>(
    API_ENDPOINTS.VISITS.HIGHLY_INTERESTED,
    { params: { limit } }
  );
  return response.data;
};

/**
 * 4. Get recent product visits
 */
export const getRecentVisitsApi = async (
  limit: number = 12
): Promise<HighlyInterestedListResponse> => {
  const response = await api.get<HighlyInterestedListResponse>(
    API_ENDPOINTS.VISITS.RECENT,
    { params: { limit } }
  );
  return response.data;
};

/**
 * 5. Admin: Get paginated user-by-product visit records with filters and stats
 */
export const getAdminVisitsApi = async (
  params?: AdminVisitsFilterParams
): Promise<AdminVisitsListResponse> => {
  const response = await api.get<AdminVisitsListResponse>(
    API_ENDPOINTS.VISITS.ADMIN_ALL,
    { params }
  );
  return response.data;
};

/**
 * 6. Admin: Get products ranked by highest total visits report
 */
export const getAdminRankedProductsApi = async (
  params?: AdminRankedFilterParams
): Promise<AdminRankedProductsResponse> => {
  const response = await api.get<AdminRankedProductsResponse>(
    API_ENDPOINTS.VISITS.ADMIN_RANKED,
    { params }
  );
  return response.data;
};
