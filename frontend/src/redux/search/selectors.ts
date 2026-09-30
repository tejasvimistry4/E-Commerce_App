import { RootState } from "../store";

export const selectSearchState = (state: RootState) => state.search;
export const selectSearchFacets = (state: RootState) => state.search.facets;
export const selectSearchFacetsLoading = (state: RootState) => state.search.facetsLoading;
export const selectSearchSuggestions = (state: RootState) => state.search.suggestions;
export const selectSearchSuggestionsLoading = (state: RootState) => state.search.suggestionsLoading;
export const selectPopularSearches = (state: RootState) => state.search.popularSearches;
export const selectPopularSearchesLoading = (state: RootState) => state.search.popularLoading;
export const selectSearchHistory = (state: RootState) => state.search.searchHistory;
export const selectSearchError = (state: RootState) => state.search.error;
