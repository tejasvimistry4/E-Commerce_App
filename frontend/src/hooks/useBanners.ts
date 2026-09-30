import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchActiveBanners,
  fetchAdminBanners,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
} from "../redux/banners/bannerThunk";
import { clearBannerErrors } from "../redux/banners/bannerSlice";
import { selectBannersState } from "../redux/banners/selectors";
import {
  Banner,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerFilterParams,
} from "../types/banner";

export function useBanners() {
  const dispatch = useAppDispatch();
  const bannerState = useAppSelector(selectBannersState);

  const loadActiveBanners = () => {
    return dispatch(fetchActiveBanners());
  };

  const loadAdminBanners = (params?: BannerFilterParams) => {
    return dispatch(fetchAdminBanners(params));
  };

  const createNewBanner = (data: CreateBannerRequest) => {
    return dispatch(createBanner(data));
  };

  const updateExistingBanner = (id: string, data: UpdateBannerRequest) => {
    return dispatch(updateBanner({ id, data }));
  };

  const toggleStatus = (id: string) => {
    return dispatch(toggleBannerStatus(id));
  };

  const removeBanner = (id: string) => {
    return dispatch(deleteBanner(id));
  };

  const resetErrors = () => {
    dispatch(clearBannerErrors());
  };

  return {
    activeBanners: bannerState.activeBanners,
    adminBanners: bannerState.adminBanners,
    totalAdminBanners: bannerState.totalAdminBanners,
    loading: bannerState.loading,
    activeBannersLoading: bannerState.activeBannersLoading,
    actionLoading: bannerState.actionLoading,
    error: bannerState.error,

    loadActiveBanners,
    loadAdminBanners,
    createNewBanner,
    updateExistingBanner,
    toggleStatus,
    removeBanner,
    resetErrors,
  };
}

export default useBanners;
