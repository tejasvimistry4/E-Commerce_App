import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AdminProductVisitItem,
  AdminVisitsListResponse,
  AdminVisitsPagination,
  AdminVisitsSummaryStats,
  AdminRankedProductItem,
  AdminRankedProductsResponse,
  TrackVisitResponse,
  ProductVisitStats,
  ProductVisitStatusResponse,
  HighlyInterestedItem,
  HighlyInterestedListResponse,
} from "../../types/visit";
import {
  fetchAdminVisits,
  fetchAdminRankedProducts,
  recordProductVisit,
  fetchProductVisitStatus,
  fetchHighlyInterestedProducts,
  fetchRecentVisits,
} from "./visitThunk";

export * from "./visitThunk";

export interface VisitState {
  // Admin Data
  adminVisits: AdminProductVisitItem[];
  adminPagination: AdminVisitsPagination | null;
  adminStats: AdminVisitsSummaryStats | null;
  rankedProducts: AdminRankedProductItem[];
  rankedStats: {
    overallVisits: number;
    overallHighlyInterested: number;
    topProduct: {
      name: string;
      visits: number;
    } | null;
  } | null;

  // Customer Data
  highlyInterested: HighlyInterestedItem[];
  recentVisits: HighlyInterestedItem[];
  currentVisitStatus: ProductVisitStats | null;

  // Loading & Error States
  loading: boolean;
  rankedLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: VisitState = {
  adminVisits: [],
  adminPagination: null,
  adminStats: null,
  rankedProducts: [],
  rankedStats: null,
  highlyInterested: [],
  recentVisits: [],
  currentVisitStatus: null,
  loading: false,
  rankedLoading: false,
  actionLoading: false,
  error: null,
};

export const visitSlice = createSlice({
  name: "visits",
  initialState,
  reducers: {
    clearVisitError: (state) => {
      state.error = null;
    },
    resetCurrentVisitStatus: (state) => {
      state.currentVisitStatus = null;
    },
  },
  extraReducers: (builder) => {
    // 1. fetchAdminVisits
    builder
      .addCase(fetchAdminVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAdminVisits.fulfilled,
        (state, action: PayloadAction<AdminVisitsListResponse>) => {
          state.loading = false;
          state.adminVisits = action.payload.items;
          state.adminPagination = action.payload.pagination;
          state.adminStats = action.payload.stats;
        }
      )
      .addCase(fetchAdminVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load admin visits.";
      });

    // 2. fetchAdminRankedProducts
    builder
      .addCase(fetchAdminRankedProducts.pending, (state) => {
        state.rankedLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAdminRankedProducts.fulfilled,
        (state, action: PayloadAction<AdminRankedProductsResponse>) => {
          state.rankedLoading = false;
          state.rankedProducts = action.payload.items;
          state.rankedStats = action.payload.stats;
        }
      )
      .addCase(fetchAdminRankedProducts.rejected, (state, action) => {
        state.rankedLoading = false;
        state.error = action.payload || "Failed to load ranked products.";
      });

    // 3. recordProductVisit
    builder
      .addCase(recordProductVisit.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(
        recordProductVisit.fulfilled,
        (state, action: PayloadAction<TrackVisitResponse>) => {
          state.actionLoading = false;
          if (state.currentVisitStatus) {
            state.currentVisitStatus.visitCount = action.payload.visitCount;
            state.currentVisitStatus.isHighlyInterested =
              action.payload.isHighlyInterested;
            state.currentVisitStatus.lastVisitedAt = action.payload.lastVisitedAt;
            state.currentVisitStatus.hasVisited = true;
          }
        }
      )
      .addCase(recordProductVisit.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to track visit.";
      });

    // 4. fetchProductVisitStatus
    builder
      .addCase(fetchProductVisitStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(
        fetchProductVisitStatus.fulfilled,
        (state, action: PayloadAction<ProductVisitStatusResponse>) => {
          state.actionLoading = false;
          state.currentVisitStatus = {
            hasVisited: action.payload.hasVisited,
            visitCount: action.payload.visitCount,
            isHighlyInterested: action.payload.isHighlyInterested,
            firstVisitedAt: action.payload.firstVisitedAt,
            lastVisitedAt: action.payload.lastVisitedAt,
            threshold: action.payload.threshold,
          };
        }
      )
      .addCase(fetchProductVisitStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to load visit status.";
      });

    // 5. fetchHighlyInterestedProducts
    builder
      .addCase(fetchHighlyInterestedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchHighlyInterestedProducts.fulfilled,
        (state, action: PayloadAction<HighlyInterestedListResponse>) => {
          state.loading = false;
          state.highlyInterested = action.payload.items;
        }
      )
      .addCase(fetchHighlyInterestedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load highly interested list.";
      });

    // 6. fetchRecentVisits
    builder
      .addCase(fetchRecentVisits.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchRecentVisits.fulfilled,
        (state, action: PayloadAction<HighlyInterestedListResponse>) => {
          state.loading = false;
          state.recentVisits = action.payload.items;
        }
      )
      .addCase(fetchRecentVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load recent visits.";
      });
  },
});

export const { clearVisitError, resetCurrentVisitStatus } = visitSlice.actions;
export default visitSlice.reducer;
