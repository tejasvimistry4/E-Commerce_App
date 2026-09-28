import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Banner } from "../../types/banner";
import { MESSAGES } from "../../constants/messages";
import {
  fetchActiveBanners,
  fetchAdminBanners,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
} from "./bannerThunk";

export * from "./bannerThunk";

export interface BannerState {
  activeBanners: Banner[];
  adminBanners: Banner[];
  totalAdminBanners: number;
  loading: boolean;
  activeBannersLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: BannerState = {
  activeBanners: [],
  adminBanners: [],
  totalAdminBanners: 0,
  loading: false,
  activeBannersLoading: false,
  actionLoading: false,
  error: null,
};

export const bannerSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {
    clearBannerErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchActiveBanners
    builder.addCase(fetchActiveBanners.pending, (state) => {
      state.activeBannersLoading = true;
      state.error = null;
    });
    builder.addCase(fetchActiveBanners.fulfilled, (state, action: PayloadAction<Banner[]>) => {
      state.activeBannersLoading = false;
      state.activeBanners = action.payload;
    });
    builder.addCase(fetchActiveBanners.rejected, (state, action) => {
      state.activeBannersLoading = false;
      state.error = action.payload || MESSAGES.BANNERS.LOAD_ACTIVE_FAILED;
    });

    // fetchAdminBanners
    builder.addCase(fetchAdminBanners.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAdminBanners.fulfilled, (state, action) => {
      state.loading = false;
      state.adminBanners = action.payload.banners;
      state.totalAdminBanners = action.payload.total;
    });
    builder.addCase(fetchAdminBanners.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || MESSAGES.BANNERS.LOAD_ADMIN_FAILED;
    });

    // createBanner
    builder.addCase(createBanner.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createBanner.fulfilled, (state, action: PayloadAction<Banner>) => {
      state.actionLoading = false;
      state.adminBanners.unshift(action.payload);
      state.totalAdminBanners += 1;
      if (action.payload.isActive) {
        state.activeBanners.unshift(action.payload);
      }
    });
    builder.addCase(createBanner.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || MESSAGES.BANNERS.SAVE_FAILED;
    });

    // updateBanner
    builder.addCase(updateBanner.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateBanner.fulfilled, (state, action: PayloadAction<Banner>) => {
      state.actionLoading = false;
      const index = state.adminBanners.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.adminBanners[index] = action.payload;
      }
      const activeIdx = state.activeBanners.findIndex((b) => b.id === action.payload.id);
      if (action.payload.isActive) {
        if (activeIdx !== -1) {
          state.activeBanners[activeIdx] = action.payload;
        } else {
          state.activeBanners.push(action.payload);
        }
      } else if (activeIdx !== -1) {
        state.activeBanners.splice(activeIdx, 1);
      }
    });
    builder.addCase(updateBanner.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || MESSAGES.BANNERS.SAVE_FAILED;
    });

    // toggleBannerStatus
    builder.addCase(toggleBannerStatus.fulfilled, (state, action: PayloadAction<Banner>) => {
      const index = state.adminBanners.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.adminBanners[index] = action.payload;
      }
      const activeIdx = state.activeBanners.findIndex((b) => b.id === action.payload.id);
      if (action.payload.isActive) {
        if (activeIdx === -1) {
          state.activeBanners.push(action.payload);
        }
      } else if (activeIdx !== -1) {
        state.activeBanners.splice(activeIdx, 1);
      }
    });

    // deleteBanner
    builder.addCase(deleteBanner.fulfilled, (state, action: PayloadAction<string>) => {
      state.adminBanners = state.adminBanners.filter((b) => b.id !== action.payload);
      state.activeBanners = state.activeBanners.filter((b) => b.id !== action.payload);
      state.totalAdminBanners = Math.max(0, state.totalAdminBanners - 1);
    });
  },
});

export const { clearBannerErrors } = bannerSlice.actions;
export default bannerSlice.reducer;
