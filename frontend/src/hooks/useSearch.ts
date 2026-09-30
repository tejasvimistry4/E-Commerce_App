import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchSearchFacets,
  fetchSearchSuggestions,
  fetchPopularSearches,
  trackSearchQuery,
  fetchUserSearchHistory,
  addUserSearchHistory,
  removeUserSearchHistory,
  clearUserSearchHistory,
  addSearchHistoryItem,
  removeSearchHistoryItem,
  clearSearchHistory,
  clearSearchSuggestions,
  setSearchHistory,
  selectSearchFacets,
  selectSearchFacetsLoading,
  selectSearchSuggestions,
  selectSearchSuggestionsLoading,
  selectPopularSearches,
  selectPopularSearchesLoading,
  selectSearchHistory,
  selectSearchError,
  loadStoredHistory,
} from "../redux/search";
import { GetFacetsParams } from "../api/search.api";

export const useSearch = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const facets = useAppSelector(selectSearchFacets);
  const facetsLoading = useAppSelector(selectSearchFacetsLoading);
  const suggestions = useAppSelector(selectSearchSuggestions);
  const suggestionsLoading = useAppSelector(selectSearchSuggestionsLoading);
  const popularSearches = useAppSelector(selectPopularSearches);
  const popularLoading = useAppSelector(selectPopularSearchesLoading);
  const searchHistory = useAppSelector(selectSearchHistory);
  const searchError = useAppSelector(selectSearchError);

  const fetchHistory = useCallback(() => {
    if (isAuthenticated && user?.id) {
      return dispatch(fetchUserSearchHistory());
    } else {
      const guestHistory = loadStoredHistory(null);
      dispatch(setSearchHistory(guestHistory));
    }
  }, [dispatch, isAuthenticated, user?.id]);

  // Synchronize user search history whenever authenticated user changes
  useEffect(() => {
    fetchHistory();
  }, [user?.id, isAuthenticated, fetchHistory]);

  const getFacets = useCallback(
    (params?: GetFacetsParams) => {
      return dispatch(fetchSearchFacets(params));
    },
    [dispatch]
  );

  const getSuggestions = useCallback(
    (query: string) => {
      return dispatch(fetchSearchSuggestions(query));
    },
    [dispatch]
  );

  const getPopular = useCallback(
    (limit = 8) => {
      return dispatch(fetchPopularSearches(limit));
    },
    [dispatch]
  );

  const trackQuery = useCallback(
    (query: string) => {
      return dispatch(trackSearchQuery(query));
    },
    [dispatch]
  );

  const addHistory = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed || trimmed.length < 2) return;

      if (isAuthenticated) {
        dispatch(addUserSearchHistory(trimmed));
      } else {
        dispatch(addSearchHistoryItem({ query: trimmed, userId: null }));
      }
    },
    [dispatch, isAuthenticated]
  );

  const removeHistory = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;

      if (isAuthenticated) {
        dispatch(removeUserSearchHistory(trimmed));
      } else {
        dispatch(removeSearchHistoryItem({ query: trimmed, userId: null }));
      }
    },
    [dispatch, isAuthenticated]
  );

  const clearHistory = useCallback(() => {
    if (isAuthenticated) {
      dispatch(clearUserSearchHistory());
    } else {
      dispatch(clearSearchHistory({ userId: null }));
    }
  }, [dispatch, isAuthenticated]);

  const clearSuggestions = useCallback(() => {
    dispatch(clearSearchSuggestions());
  }, [dispatch]);

  return {
    facets,
    facetsLoading,
    suggestions,
    suggestionsLoading,
    popularSearches,
    popularLoading,
    searchHistory,
    searchError,
    fetchHistory,
    getFacets,
    getSuggestions,
    getPopular,
    trackQuery,
    addHistory,
    removeHistory,
    clearHistory,
    clearSuggestions,
    user,
    isAuthenticated,
  };
};

export default useSearch;

