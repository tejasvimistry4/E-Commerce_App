import { RootState } from "../store";

export const selectBannersState = (state: RootState) => state.banners;
export const selectActiveBanners = (state: RootState) => state.banners.activeBanners;
export const selectAdminBanners = (state: RootState) => state.banners.adminBanners;
export const selectTotalAdminBanners = (state: RootState) => state.banners.totalAdminBanners;
export const selectBannersLoading = (state: RootState) => state.banners.loading;
export const selectActiveBannersLoading = (state: RootState) => state.banners.activeBannersLoading;
export const selectBannersActionLoading = (state: RootState) => state.banners.actionLoading;
export const selectBannersError = (state: RootState) => state.banners.error;
