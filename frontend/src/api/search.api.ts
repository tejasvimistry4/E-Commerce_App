import axiosInstance from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import { SearchFacets, SearchSuggestions } from "../types/search";

export interface GetFacetsParams {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Fetch dynamic search aggregation facets for current search criteria
 */
export const getSearchFacetsApi = async (
  params?: GetFacetsParams
): Promise<{ success: boolean; data: SearchFacets }> => {
  const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.SEARCH_FACETS, {
    params,
  });
  return response.data;
};

/**
 * Fetch live search suggestions, category matches, popular searches, and typo corrections
 */
export const getSearchSuggestionsApi = async (
  query: string
): Promise<{ success: boolean; data: SearchSuggestions }> => {
  const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.SEARCH_SUGGESTIONS, {
    params: { q: query },
  });
  return response.data;
};

/**
 * Fetch top trending search terms
 */
export const getPopularSearchesApi = async (
  limit = 8
): Promise<{ success: boolean; data: Array<{ query: string; count: number }> }> => {
  const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.SEARCH_POPULAR, {
    params: { limit },
  });
  return response.data;
};

/**
 * Log search query for popularity tracking
 */
export const trackSearchApi = async (query: string): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(API_ENDPOINTS.PRODUCTS.SEARCH_TRACK, {
    query,
  });
  return response.data;
};

/**
 * Fetch authenticated user's search history from backend
 */
export const getUserSearchHistoryApi = async (): Promise<{
  success: boolean;
  data: string[];
}> => {
  const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.SEARCH_HISTORY);
  return response.data;
};

/**
 * Add or update search query in authenticated user's history
 */
export const addUserSearchHistoryApi = async (
  query: string
): Promise<{ success: boolean; data: string[] }> => {
  const response = await axiosInstance.post(API_ENDPOINTS.PRODUCTS.SEARCH_HISTORY, {
    query,
  });
  return response.data;
};

/**
 * Remove a specific search query from authenticated user's history
 */
export const removeUserSearchHistoryApi = async (
  query: string
): Promise<{ success: boolean; data: string[] }> => {
  const response = await axiosInstance.delete(API_ENDPOINTS.PRODUCTS.SEARCH_HISTORY, {
    data: { query },
  });
  return response.data;
};

/**
 * Clear all search history for authenticated user
 */
export const clearUserSearchHistoryApi = async (): Promise<{
  success: boolean;
  data: string[];
}> => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.PRODUCTS.SEARCH_HISTORY_CLEAR
  );
  return response.data;
};

