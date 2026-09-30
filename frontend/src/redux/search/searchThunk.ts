import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getSearchFacetsApi,
  getSearchSuggestionsApi,
  getPopularSearchesApi,
  trackSearchApi,
  getUserSearchHistoryApi,
  addUserSearchHistoryApi,
  removeUserSearchHistoryApi,
  clearUserSearchHistoryApi,
  GetFacetsParams,
} from "../../api/search.api";
import { SearchFacets, SearchSuggestions } from "../../types/search";

// 1. Fetch dynamic search aggregation facets
export const fetchSearchFacets = createAsyncThunk<
  SearchFacets,
  GetFacetsParams | undefined,
  { rejectValue: string }
>("search/fetchSearchFacets", async (params, { rejectWithValue }) => {
  try {
    const res = await getSearchFacetsApi(params);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load search facets"
    );
  }
});

// 2. Fetch live debounced search autocomplete suggestions
export const fetchSearchSuggestions = createAsyncThunk<
  SearchSuggestions,
  string,
  { rejectValue: string }
>("search/fetchSearchSuggestions", async (query, { rejectWithValue }) => {
  try {
    const res = await getSearchSuggestionsApi(query);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load search suggestions"
    );
  }
});

// 3. Fetch top trending / popular searches
export const fetchPopularSearches = createAsyncThunk<
  Array<{ query: string; count: number }>,
  number | undefined,
  { rejectValue: string }
>("search/fetchPopularSearches", async (limit = 8, { rejectWithValue }) => {
  try {
    const res = await getPopularSearchesApi(limit);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load popular searches"
    );
  }
});

// 4. Track search query analytics
export const trackSearchQuery = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("search/trackSearchQuery", async (query, { rejectWithValue }) => {
  try {
    await trackSearchApi(query);
    return query;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to track search query"
    );
  }
});

// 5. Fetch authenticated user search history
export const fetchUserSearchHistory = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("search/fetchUserSearchHistory", async (_, { rejectWithValue }) => {
  try {
    const res = await getUserSearchHistoryApi();
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load search history"
    );
  }
});

// 6. Add search history item for authenticated user
export const addUserSearchHistory = createAsyncThunk<
  string[],
  string,
  { rejectValue: string }
>("search/addUserSearchHistory", async (query, { rejectWithValue }) => {
  try {
    const res = await addUserSearchHistoryApi(query);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to add search history"
    );
  }
});

// 7. Remove specific search history item for authenticated user
export const removeUserSearchHistory = createAsyncThunk<
  string[],
  string,
  { rejectValue: string }
>("search/removeUserSearchHistory", async (query, { rejectWithValue }) => {
  try {
    const res = await removeUserSearchHistoryApi(query);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to remove search history"
    );
  }
});

// 8. Clear all search history for authenticated user
export const clearUserSearchHistory = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("search/clearUserSearchHistory", async (_, { rejectWithValue }) => {
  try {
    const res = await clearUserSearchHistoryApi();
    return res.data || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to clear search history"
    );
  }
});

