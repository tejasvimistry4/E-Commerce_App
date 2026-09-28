import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Product,
  ProductPagination,
  ProductFilterParams,
  CreateProductPayload,
  UpdateProductPayload,
  getProductsApi,
  getFeaturedProductsApi,
  getProductBySlugApi,
  getProductByIdApi,
  getAdminProductsApi,
  createProductApi,
  updateProductApi,
  toggleProductStatusApi,
  deleteProductApi,
} from "../../api/product.api";

// 1. Fetch Storefront Products (Filter, paginate, search)
export const fetchProducts = createAsyncThunk<
  { products: Product[]; pagination: ProductPagination; didYouMean?: string | null },
  ProductFilterParams | undefined,
  { rejectValue: string }
>("products/fetchProducts", async (params, { rejectWithValue }) => {
  try {
    const res = await getProductsApi(params);
    return {
      products: res.data,
      pagination: res.pagination,
      didYouMean: res.didYouMean || null,
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load products"
    );
  }
});

// 2. Fetch Featured Products
export const fetchFeaturedProducts = createAsyncThunk<
  Product[],
  number | undefined,
  { rejectValue: string }
>("products/fetchFeaturedProducts", async (limit, { rejectWithValue }) => {
  try {
    const res = await getFeaturedProductsApi(limit);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load featured products"
    );
  }
});

// 3. Fetch Product by Slug
export const fetchProductBySlug = createAsyncThunk<
  { product: Product; relatedProducts: Product[] },
  string,
  { rejectValue: string }
>("products/fetchProductBySlug", async (slug, { rejectWithValue }) => {
  try {
    const res = await getProductBySlugApi(slug);
    return {
      product: res.data,
      relatedProducts: res.relatedProducts || [],
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Product not found"
    );
  }
});

// 4. Fetch Product by ID
export const fetchProductById = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>("products/fetchProductById", async (id, { rejectWithValue }) => {
  try {
    const res = await getProductByIdApi(id);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load product details"
    );
  }
});

// 5. Fetch Admin Products
export const fetchAdminProducts = createAsyncThunk<
  {
    products: Product[];
    stats: {
      total: number;
      active: number;
      inactive: number;
      outOfStock: number;
      inStock: number;
      featured: number;
    };
  },
  { search?: string; categoryId?: string; isActive?: boolean; isFeatured?: boolean } | undefined,
  { rejectValue: string }
>("products/fetchAdminProducts", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminProductsApi(params);
    return {
      products: res.data,
      stats: res.stats,
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load admin products"
    );
  }
});

// 6. Create Product (Admin Only)
export const createProduct = createAsyncThunk<
  Product,
  CreateProductPayload,
  { rejectValue: string }
>("products/createProduct", async (payload, { rejectWithValue }) => {
  try {
    const res = await createProductApi(payload);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to create product"
    );
  }
});

// 7. Update Product (Admin Only)
export const updateProduct = createAsyncThunk<
  Product,
  { id: string; payload: UpdateProductPayload },
  { rejectValue: string }
>("products/updateProduct", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await updateProductApi(id, payload);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update product"
    );
  }
});

// 8. Toggle Product Status (Admin Only)
export const toggleProductStatus = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>("products/toggleProductStatus", async (id, { rejectWithValue }) => {
  try {
    const res = await toggleProductStatusApi(id);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to toggle product status"
    );
  }
});

// 9. Delete Product (Admin Only)
export const deleteProduct = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("products/deleteProduct", async (id, { rejectWithValue }) => {
  try {
    await deleteProductApi(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to delete product"
    );
  }
});
