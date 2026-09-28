import axiosInstance from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  Banner,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerFilterParams,
  ActiveBannersResponse,
  AdminBannersResponse,
  SingleBannerResponse,
} from "../types/banner";

export * from "../types/banner";

/**
 * Customer: Get currently active & scheduled banners for the storefront
 */
export const getActiveBannersApi = async (): Promise<ActiveBannersResponse> => {
  const res = await axiosInstance.get<ActiveBannersResponse>(API_ENDPOINTS.BANNERS.ACTIVE);
  return res.data;
};

/**
 * Admin: Get all banners with search, type, and status filters
 */
export const getAdminBannersApi = async (
  params?: BannerFilterParams
): Promise<AdminBannersResponse> => {
  const res = await axiosInstance.get<AdminBannersResponse>(
    API_ENDPOINTS.BANNERS.ADMIN_ALL,
    { params }
  );
  return res.data;
};

/**
 * Admin: Get banner details by ID
 */
export const getBannerByIdApi = async (id: string): Promise<SingleBannerResponse> => {
  const res = await axiosInstance.get<SingleBannerResponse>(
    API_ENDPOINTS.BANNERS.BY_ID(id)
  );
  return res.data;
};

/**
 * Admin: Create a new banner campaign
 */
export const createBannerApi = async (
  data: CreateBannerRequest
): Promise<SingleBannerResponse> => {
  const res = await axiosInstance.post<SingleBannerResponse>(
    "/banners",
    data
  );
  return res.data;
};

/**
 * Admin: Update existing banner campaign
 */
export const updateBannerApi = async (
  id: string,
  data: UpdateBannerRequest
): Promise<SingleBannerResponse> => {
  const res = await axiosInstance.put<SingleBannerResponse>(
    API_ENDPOINTS.BANNERS.BY_ID(id),
    data
  );
  return res.data;
};

/**
 * Admin: Toggle banner active/disabled status
 */
export const toggleBannerStatusApi = async (
  id: string
): Promise<SingleBannerResponse> => {
  const res = await axiosInstance.patch<SingleBannerResponse>(
    API_ENDPOINTS.BANNERS.STATUS(id)
  );
  return res.data;
};

/**
 * Admin: Delete banner campaign
 */
export const deleteBannerApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await axiosInstance.delete<{ success: boolean; message: string }>(
    API_ENDPOINTS.BANNERS.BY_ID(id)
  );
  return res.data;
};
