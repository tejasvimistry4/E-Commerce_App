import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import productService from "./product.service";
import searchService from "./search.service";
import cacheService from "../../services/cache.service";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class ProductController {
  /**
   * GET /api/products - List customer products with Advanced Search & Filter
   */
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        page,
        limit,
        search,
        categoryId,
        categorySlug,
        brand,
        minPrice,
        maxPrice,
        minRating,
        minDiscount,
        isFeatured,
        inStockOnly,
        color,
        size,
        material,
        attributes,
        vendorId,
        sortBy,
        sortOrder,
      } = req.query;

      // Extract dynamic attribute dictionary from query if present
      let parsedAttributes: Record<string, any> = {};
      if (attributes && typeof attributes === "object") {
        parsedAttributes = attributes as Record<string, any>;
      }

      const result = await productService.getProducts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        categoryId: categoryId as string,
        categorySlug: categorySlug as string,
        brand: brand as string,
        minPrice: minPrice !== undefined && minPrice !== "" ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : undefined,
        minRating: minRating !== undefined && minRating !== "" ? Number(minRating) : undefined,
        minDiscount: minDiscount !== undefined && minDiscount !== "" ? Number(minDiscount) : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured === "true" : undefined,
        inStockOnly: inStockOnly !== undefined ? inStockOnly === "true" : undefined,
        color: color as string,
        size: size as string,
        material: material as string,
        attributes: Object.keys(parsedAttributes).length > 0 ? parsedAttributes : undefined,
        vendorId: vendorId as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        isActive: true,
      });

      return res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        didYouMean: (result as any).didYouMean || null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search/facets - Get dynamic aggregation facets for active filters
   */
  async getSearchFacets(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, categoryId, categorySlug, brand, minPrice, maxPrice } = req.query;

      const facets = await searchService.getSearchFacets({
        search: search as string,
        categoryId: categoryId as string,
        categorySlug: categorySlug as string,
        brand: brand as string,
        minPrice: minPrice !== undefined && minPrice !== "" ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: facets,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search/suggestions - Fast Autocomplete & Live Search Suggestions
   */
  async getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q || req.query.query || req.query.search || "") as string;
      const suggestions = await searchService.getSearchSuggestions(query);

      return res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search/popular - Get top trending and popular searches
   */
  async getPopularSearches(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const minThreshold = req.query.minThreshold ? Number(req.query.minThreshold) : 3;
      const popular = await searchService.getDynamicPopularSearches(limit, minThreshold);

      return res.status(200).json({
        success: true,
        data: popular,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/search/track - Log search query for popularity analytics
   */
  async trackSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      if (query && typeof query === "string") {
        const trimmed = query.trim();
        // Only track complete catalog terms for trending searches (skip partial fragments like 'wa', 'wat', 'watc')
        if (trimmed.length >= 3 && (await searchService.isCompleteCatalogTerm(trimmed))) {
          await cacheService.trackSearchQuery(trimmed);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Search query tracked successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search/history - Get authenticated user's search history
   */
  async getUserSearchHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const history = await searchService.getUserSearchHistory(userId);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/search/history - Add search query to authenticated user's history
   */
  async addUserSearchHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const { query } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({
          success: false,
          message: "Valid search query is required.",
        });
      }

      const history = await searchService.addUserSearchHistory(userId, query.trim());

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/search/history - Remove specific item from authenticated user's history
   */
  async removeUserSearchHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const query = (req.body?.query || req.query?.query || "") as string;
      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Valid search query is required to remove.",
        });
      }

      const history = await searchService.removeUserSearchHistory(userId, query.trim());

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/search/history/clear - Clear all search history for authenticated user
   */
  async clearUserSearchHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const history = await searchService.clearUserSearchHistory(userId);

      return res.status(200).json({
        success: true,
        data: history,
        message: "Search history cleared successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/featured - Featured products
   */
  async getFeaturedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const products = await productService.getFeaturedProducts(limit);

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/admin/all - Admin & Vendor product directory
   */
  async getAdminProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search, categoryId, isActive, isFeatured, vendorId } = req.query;

      // If caller is VENDOR, automatically scope to their vendor ID
      const scopedVendorId =
        req.user?.role === "VENDOR"
          ? req.user.id
          : (vendorId as string) || undefined;

      const products = await productService.getAdminProducts({
        search: search as string,
        categoryId: categoryId as string,
        vendorId: scopedVendorId,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured === "true" : undefined,
      });

      const stats = await productService.getProductStats(scopedVendorId);

      return res.status(200).json({
        success: true,
        data: products,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/slug/:slug - Product details by slug
   */
  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;
      const result = await productService.getProductBySlug(slug);

      return res.status(200).json({
        success: true,
        data: result.product,
        relatedProducts: result.relatedProducts,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || "Product not found",
      });
    }
  }

  /**
   * GET /api/products/:id - Product details by ID
   */
  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductById(id);

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || "Product not found",
      });
    }
  }

  /**
   * POST /api/products - Create a new product (Super Admin or Vendor)
   */
  async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // If caller is VENDOR, automatically assign their vendor ID
      const assignedVendorId =
        req.user?.role === "VENDOR" ? req.user.id : req.body.vendorId || null;

      const product = await productService.createProduct(req.body, assignedVendorId);

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create product",
      });
    }
  }

  /**
   * PUT /api/products/:id - Update product (Super Admin or Vendor)
   */
  async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const id = req.params.id as string;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const product = await productService.updateProduct(id, req.body, caller);

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update product",
      });
    }
  }

  /**
   * PATCH /api/products/:id/status - Toggle active status (Super Admin or Vendor)
   */
  async toggleProductStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const product = await productService.toggleProductStatus(id, caller);

      return res.status(200).json({
        success: true,
        message: `Product is now ${product.isActive ? "Active" : "Inactive"}`,
        data: product,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to toggle product status",
      });
    }
  }

  /**
   * DELETE /api/products/:id - Delete product (Super Admin or Vendor)
   */
  async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const result = await productService.deleteProduct(id, caller);

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to delete product",
      });
    }
  }

  /**
   * ==========================================
   * Dedicated Product Variant Endpoints
   * ==========================================
   */

  /**
   * GET /api/products/:productId/variants - Get product variants
   */
  async getProductVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const variants = await productService.getProductVariants(productId);

      return res.status(200).json({
        success: true,
        data: variants,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch product variants",
      });
    }
  }

  /**
   * POST /api/products/:productId/variants - Create product variant (Super Admin or Vendor)
   */
  async createVariant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const productId = req.params.productId as string;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const variant = await productService.createVariant(productId, req.body, caller);

      return res.status(201).json({
        success: true,
        message: "Product variant created successfully",
        data: variant,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to create variant",
      });
    }
  }

  /**
   * PUT /api/products/variants/:variantId - Update product variant (Super Admin or Vendor)
   */
  async updateVariant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const variantId = req.params.variantId as string;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const variant = await productService.updateVariant(variantId, req.body, caller);

      return res.status(200).json({
        success: true,
        message: "Product variant updated successfully",
        data: variant,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update variant",
      });
    }
  }

  /**
   * DELETE /api/products/variants/:variantId - Delete product variant (Super Admin or Vendor)
   */
  async deleteVariant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const variantId = req.params.variantId as string;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const result = await productService.deleteVariant(variantId, caller);

      return res.status(200).json({
        success: true,
        message: "Product variant deleted successfully",
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to delete variant",
      });
    }
  }
}

export default new ProductController();
