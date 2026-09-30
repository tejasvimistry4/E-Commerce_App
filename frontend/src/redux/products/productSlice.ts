import { createSlice } from "@reduxjs/toolkit";
import { Product, ProductPagination } from "../../types/product";
import {
  fetchProducts,
  fetchFeaturedProducts,
  fetchProductBySlug,
  fetchProductById,
  fetchAdminProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from "./productThunk";

export * from "./productThunk";

export interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  pagination: ProductPagination | null;
  didYouMean: string | null;
  adminStats: {
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
    inStock: number;
    featured: number;
  } | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  currentProduct: null,
  relatedProducts: [],
  pagination: null,
  didYouMean: null,
  adminStats: null,
  loading: false,
  actionLoading: false,
  error: null,
};

export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.relatedProducts = [];
    },
    clearProductError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.didYouMean = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.didYouMean = action.payload.didYouMean || null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load products";
        state.didYouMean = null;
      })

      // Fetch Featured Products
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      })

      // Fetch Product by Slug
      .addCase(fetchProductBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload.product;
        state.relatedProducts = action.payload.relatedProducts;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Product not found";
      })

      // Fetch Admin Products
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.adminStats = action.payload.stats;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load products";
      })

      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.products.unshift(action.payload);
        if (state.adminStats) {
          state.adminStats.total += 1;
          if (action.payload.isActive) state.adminStats.active += 1;
          else state.adminStats.inactive += 1;
          if (action.payload.stock === 0) state.adminStats.outOfStock += 1;
          else state.adminStats.inStock += 1;
          if (action.payload.isFeatured) state.adminStats.featured += 1;
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create product";
      })

      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct?.id === action.payload.id) {
          state.currentProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update product";
      })

      // Toggle Product Status
      .addCase(toggleProductStatus.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.adminStats) {
          if (action.payload.isActive) {
            state.adminStats.active += 1;
            state.adminStats.inactive -= 1;
          } else {
            state.adminStats.active -= 1;
            state.adminStats.inactive += 1;
          }
        }
      })

      // Delete Product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const deletedProduct = state.products.find((p) => p.id === deletedId);
        state.products = state.products.filter((p) => p.id !== deletedId);
        if (state.adminStats && deletedProduct) {
          state.adminStats.total -= 1;
          if (deletedProduct.isActive) state.adminStats.active -= 1;
          else state.adminStats.inactive -= 1;
          if (deletedProduct.stock === 0) state.adminStats.outOfStock -= 1;
          else state.adminStats.inStock -= 1;
          if (deletedProduct.isFeatured) state.adminStats.featured -= 1;
        }
      });
  },
});

export const { clearCurrentProduct, clearProductError } = productSlice.actions;
export default productSlice.reducer;
