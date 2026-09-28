import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Banner,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerFilterParams,
} from "../../types/banner";
import {
  getActiveBannersApi,
  getAdminBannersApi,
  createBannerApi,
  updateBannerApi,
  toggleBannerStatusApi,
  deleteBannerApi,
} from "../../api/banner.api";
import { MESSAGES } from "../../constants/messages";

// 1. Fetch active banners for customer storefront
export const fetchActiveBanners = createAsyncThunk<
  Banner[],
  void,
  { rejectValue: string }
>("banners/fetchActiveBanners", async (_, { rejectWithValue }) => {
  try {
    const res = await getActiveBannersApi();
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.BANNERS.LOAD_ACTIVE_FAILED;
    return rejectWithValue(message);
  }
});

// 2. Fetch all banners for Admin dashboard
export const fetchAdminBanners = createAsyncThunk<
  { banners: Banner[]; total: number },
  BannerFilterParams | undefined,
  { rejectValue: string }
>("banners/fetchAdminBanners", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminBannersApi(params);
    return { banners: res.banners, total: res.total };
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.BANNERS.LOAD_ADMIN_FAILED;
    return rejectWithValue(message);
  }
});

// 3. Create banner (Admin)
export const createBanner = createAsyncThunk<
  Banner,
  CreateBannerRequest,
  { rejectValue: string }
>("banners/createBanner", async (data, { rejectWithValue }) => {
  try {
    const res = await createBannerApi(data);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.BANNERS.SAVE_FAILED;
    return rejectWithValue(message);
  }
});

// 4. Update banner (Admin)
export const updateBanner = createAsyncThunk<
  Banner,
  { id: string; data: UpdateBannerRequest },
  { rejectValue: string }
>("banners/updateBanner", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await updateBannerApi(id, data);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.BANNERS.SAVE_FAILED;
    return rejectWithValue(message);
  }
});

// 5. Toggle banner active status (Admin)
export const toggleBannerStatus = createAsyncThunk<
  Banner,
  string,
  { rejectValue: string }
>("banners/toggleBannerStatus", async (id, { rejectWithValue }) => {
  try {
    const res = await toggleBannerStatusApi(id);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.BANNERS.STATUS_FAILED;
    return rejectWithValue(message);
  }
});

// 6. Delete banner (Admin)
export const deleteBanner = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("banners/deleteBanner", async (id, { rejectWithValue }) => {
  try {
    await deleteBannerApi(id);
    return id;
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.BANNERS.DELETE_FAILED;
    return rejectWithValue(message);
  }
});
