import { RootState } from "../store";

export const selectProductsState = (state: RootState) => state.products;
export const selectProducts = (state: RootState) => state.products.products;
export const selectFeaturedProducts = (state: RootState) => state.products.featuredProducts;
export const selectCurrentProduct = (state: RootState) => state.products.currentProduct;
export const selectRelatedProducts = (state: RootState) => state.products.relatedProducts;
export const selectProductPagination = (state: RootState) => state.products.pagination;
export const selectAdminProductStats = (state: RootState) => state.products.adminStats;
export const selectProductsLoading = (state: RootState) => state.products.loading;
export const selectProductsActionLoading = (state: RootState) => state.products.actionLoading;
export const selectProductsError = (state: RootState) => state.products.error;
