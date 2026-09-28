import { RootState } from "../store";

export const selectCategoriesState = (state: RootState) => state.categories;
export const selectAllCategories = (state: RootState) => state.categories.categories;
export const selectCategoryTree = (state: RootState) => state.categories.categoryTree;
export const selectCurrentCategory = (state: RootState) => state.categories.currentCategory;
export const selectCategoriesLoading = (state: RootState) => state.categories.loading;
export const selectCategoriesActionLoading = (state: RootState) => state.categories.actionLoading;
export const selectCategoriesError = (state: RootState) => state.categories.error;
