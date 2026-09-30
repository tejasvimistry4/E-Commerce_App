import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchFacets, SearchSuggestions } from "../../types/search";
import {
  fetchSearchFacets,
  fetchSearchSuggestions,
  fetchPopularSearches,
  trackSearchQuery,
  fetchUserSearchHistory,
  addUserSearchHistory,
  removeUserSearchHistory,
  clearUserSearchHistory,
} from "./searchThunk";

export * from "./searchThunk";

const MAX_HISTORY_ITEMS = 8;

export const getSearchStorageKey = (userId?: string | null): string => {
  return userId ? `ecommerce_search_history_${userId}` : "ecommerce_search_history_guest";
};

export const loadStoredHistory = (userId?: string | null): string[] => {
  try {
    const key = getSearchStorageKey(userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveStoredHistory = (items: string[], userId?: string | null) => {
  try {
    const key = getSearchStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
};

export const clearStoredUserHistory = (userId?: string | null) => {
  try {
    const key = getSearchStorageKey(userId);
    localStorage.removeItem(key);
  } catch {}
};

export interface SearchState {
  facets: SearchFacets | null;
  facetsLoading: boolean;
  suggestions: SearchSuggestions | null;
  suggestionsLoading: boolean;
  popularSearches: Array<{ query: string; count: number }>;
  popularLoading: boolean;
  searchHistory: string[];
  historyLoading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  facets: null,
  facetsLoading: false,
  suggestions: null,
  suggestionsLoading: false,
  popularSearches: [],
  popularLoading: false,
  searchHistory: [],
  historyLoading: false,
  error: null,
};

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchHistory: (state, action: PayloadAction<string[]>) => {
      state.searchHistory = action.payload;
    },
    addSearchHistoryItem: (
      state,
      action: PayloadAction<{ query: string; userId?: string | null }>
    ) => {
      const { query, userId } = action.payload;
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) return;
      const filtered = state.searchHistory.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      state.searchHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveStoredHistory(state.searchHistory, userId);
    },
    removeSearchHistoryItem: (
      state,
      action: PayloadAction<{ query: string; userId?: string | null }>
    ) => {
      const { query, userId } = action.payload;
      state.searchHistory = state.searchHistory.filter(
        (item) => item.toLowerCase() !== query.toLowerCase().trim()
      );
      saveStoredHistory(state.searchHistory, userId);
    },
    clearSearchHistory: (state, action: PayloadAction<{ userId?: string | null } | undefined>) => {
      state.searchHistory = [];
      clearStoredUserHistory(action?.payload?.userId);
    },
    clearSearchSuggestions: (state) => {
      state.suggestions = null;
    },
    clearSearchError: (state) => {
      state.error = null;
    },
    resetSearchState: (state) => {
      state.searchHistory = [];
      state.suggestions = null;
      state.facets = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Search Facets
      .addCase(fetchSearchFacets.pending, (state) => {
        state.facetsLoading = true;
        state.error = null;
      })
      .addCase(fetchSearchFacets.fulfilled, (state, action) => {
        state.facetsLoading = false;
        state.facets = action.payload;
      })
      .addCase(fetchSearchFacets.rejected, (state, action) => {
        state.facetsLoading = false;
        state.error = action.payload || "Failed to load facets";
      })

      // Fetch Search Suggestions
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchSearchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.error = action.payload || "Failed to load suggestions";
      })

      // Fetch Popular Searches
      .addCase(fetchPopularSearches.pending, (state) => {
        state.popularLoading = true;
      })
      .addCase(fetchPopularSearches.fulfilled, (state, action) => {
        state.popularLoading = false;
        state.popularSearches = action.payload;
      })
      .addCase(fetchPopularSearches.rejected, (state) => {
        state.popularLoading = false;
      })

      // Track Search Query (pure telemetry, does not alter local search history)
      .addCase(trackSearchQuery.fulfilled, () => {
        // No-op on local state; search history is exclusively managed per authenticated user or guest storage
      })

      // Fetch User Search History (Authenticated)
      .addCase(fetchUserSearchHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchUserSearchHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.searchHistory = action.payload || [];
      })
      .addCase(fetchUserSearchHistory.rejected, (state) => {
        state.historyLoading = false;
      })

      // Add User Search History (Authenticated) - Optimistic update + fulfilled reconciliation
      .addCase(addUserSearchHistory.pending, (state, action) => {
        const query = action.meta.arg;
        if (query) {
          const trimmed = query.trim();
          if (trimmed.length >= 2) {
            const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            const filtered = state.searchHistory.filter(
              (item) => item.toLowerCase() !== trimmed.toLowerCase()
            );
            state.searchHistory = [formatted, ...filtered].slice(0, MAX_HISTORY_ITEMS);
          }
        }
      })
      .addCase(addUserSearchHistory.fulfilled, (state, action) => {
        if (action.payload && action.payload.length > 0) {
          state.searchHistory = action.payload;
        }
      })

      // Remove User Search History (Authenticated) - Optimistic update + fulfilled reconciliation
      .addCase(removeUserSearchHistory.pending, (state, action) => {
        const query = action.meta.arg;
        if (query) {
          state.searchHistory = state.searchHistory.filter(
            (item) => item.toLowerCase() !== query.toLowerCase().trim()
          );
        }
      })
      .addCase(removeUserSearchHistory.fulfilled, (state, action) => {
        if (action.payload) {
          state.searchHistory = action.payload;
        }
      })

      // Clear User Search History (Authenticated) - Optimistic update + fulfilled reconciliation
      .addCase(clearUserSearchHistory.pending, (state) => {
        state.searchHistory = [];
      })
      .addCase(clearUserSearchHistory.fulfilled, (state, action) => {
        state.searchHistory = action.payload || [];
      })

      // Handle user logout: Completely purge search history and suggestions so no search data bleeds
      .addCase("auth/logoutUser", (state) => {
        state.searchHistory = [];
        state.suggestions = null;
        state.facets = null;
        state.error = null;
      });
  },
});

export const {
  setSearchHistory,
  addSearchHistoryItem,
  removeSearchHistoryItem,
  clearSearchHistory,
  clearSearchSuggestions,
  clearSearchError,
  resetSearchState,
} = searchSlice.actions;

export default searchSlice.reducer;

