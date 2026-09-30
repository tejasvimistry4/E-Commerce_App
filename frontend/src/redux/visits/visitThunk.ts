import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  AdminVisitsListResponse,
  AdminVisitsFilterParams,
  AdminRankedProductsResponse,
  AdminRankedFilterParams,
  TrackVisitResponse,
  ProductVisitStatusResponse,
  HighlyInterestedListResponse,
} from "../../types/visit";
import {
  trackProductVisitApi,
  getProductVisitStatusApi,
  getHighlyInterestedProductsApi,
  getRecentVisitsApi,
  getAdminVisitsApi,
  getAdminRankedProductsApi,
} from "../../api/visit.api";

/**
 * 1. Admin: Fetch all user-by-product visit logs with filters & pagination
 */
export const fetchAdminVisits = createAsyncThunk<
  AdminVisitsListResponse,
  AdminVisitsFilterParams | undefined,
  { rejectValue: string }
>("visits/fetchAdminVisits", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminVisitsApi(params);
    return res;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to load admin visits telemetry."
    );
  }
});

/**
 * 2. Admin: Fetch products ranked by total visits
 */
export const fetchAdminRankedProducts = createAsyncThunk<
  AdminRankedProductsResponse,
  AdminRankedFilterParams | undefined,
  { rejectValue: string }
>("visits/fetchAdminRankedProducts", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminRankedProductsApi(params);
    return res;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to load ranked products analytics."
    );
  }
});

/**
 * 3. Track product visit for authenticated user
 */
export const recordProductVisit = createAsyncThunk<
  TrackVisitResponse,
  string,
  { rejectValue: string }
>("visits/recordProductVisit", async (productId, { rejectWithValue }) => {
  try {
    const res = await trackProductVisitApi(productId);
    return res;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to track product visit."
    );
  }
});

/**
 * 4. Fetch visit status for a product
 */
export const fetchProductVisitStatus = createAsyncThunk<
  ProductVisitStatusResponse,
  string,
  { rejectValue: string }
>("visits/fetchProductVisitStatus", async (productId, { rejectWithValue }) => {
  try {
    const res = await getProductVisitStatusApi(productId);
    return res;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to fetch visit status."
    );
  }
});

/**
 * 5. Fetch all highly interested products for logged-in user
 */
export const fetchHighlyInterestedProducts = createAsyncThunk<
  HighlyInterestedListResponse,
  number | undefined,
  { rejectValue: string }
>("visits/fetchHighlyInterestedProducts", async (limit, { rejectWithValue }) => {
  try {
    const res = await getHighlyInterestedProductsApi(limit);
    return res;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to load highly interested products."
    );
  }
});

/**
 * 6. Fetch recent product visits for logged-in user
 */
export const fetchRecentVisits = createAsyncThunk<
  HighlyInterestedListResponse,
  number | undefined,
  { rejectValue: string }
>("visits/fetchRecentVisits", async (limit, { rejectWithValue }) => {
  try {
    const res = await getRecentVisitsApi(limit);
    return res;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to load recent visits."
    );
  }
});
