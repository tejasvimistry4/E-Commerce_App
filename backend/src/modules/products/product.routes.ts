import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import productController from "./product.controller";
import visualSearchController from "./visualSearch.controller";
import visitController from "../visits/visit.controller";
import {
  createProductValidator,
  updateProductValidator,
  productIdParamValidator,
  productSlugParamValidator,
  createVariantValidator,
  updateVariantValidator,
  variantIdParamValidator,
} from "./product.validator";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";
import { uploadSingle } from "../../middleware/upload.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { visitQueryValidator } from "../visits/visit.validator";

const router = Router();

// Middleware to handle single image upload error gracefully for visual search
const handleVisualSearchUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadSingle(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Uploaded image exceeds size limit of 10MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process image.",
      });
    }
    next();
  });
};

/**
 * @swagger
 * /products/visual-search:
 *   post:
 *     summary: Search products by uploading an image (Visual Search)
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 0.35
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStockOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of visually similar products ranked by similarity
 */
router.post("/visual-search", handleVisualSearchUpload, visualSearchController.searchByImage);

/**
 * @swagger
 * /products/admin/sync-embeddings:
 *   post:
 *     summary: Sync and generate embeddings for all products in catalog (SUPER_ADMIN Only)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Indexing results and stats
 */
router.post(
  "/admin/sync-embeddings",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  visualSearchController.syncEmbeddings
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List customer products (Search, filter, paginate)
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categorySlug
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: inStockOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, rating, createdAt, name]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get("/", productController.getProducts);

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products showcase
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: List of featured products
 */
router.get("/featured", productController.getFeaturedProducts);

/**
 * @swagger
 * /products/search/facets:
 *   get:
 *     summary: Dynamic search aggregation facets (Categories, Brands, Price range, Attributes, Ratings, Discounts)
 *     tags:
 *       - Products
 *       - Search
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dynamic facet aggregations
 */
router.get("/search/facets", productController.getSearchFacets);

/**
 * @swagger
 * /products/search/suggestions:
 *   get:
 *     summary: Live debounced search autocomplete & suggestions
 *     tags:
 *       - Products
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching products, categories, brands, popular searches, and typo correction
 */
router.get("/search/suggestions", productController.getSearchSuggestions);

/**
 * @swagger
 * /products/search/popular:
 *   get:
 *     summary: Top popular & trending search terms
 *     tags:
 *       - Products
 *       - Search
 *     responses:
 *       200:
 *         description: List of popular queries with frequency
 */
router.get("/search/popular", productController.getPopularSearches);

/**
 * @swagger
 * /products/search/track:
 *   post:
 *     summary: Track search query analytics
 *     tags:
 *       - Products
 *       - Search
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Query tracked
 */
router.post("/search/track", productController.trackSearch);

/**
 * @swagger
 * /products/search/history:
 *   get:
 *     summary: Get authenticated user's search history
 *     tags:
 *       - Search
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent search queries
 *   post:
 *     summary: Add query to authenticated user's search history
 *     tags:
 *       - Search
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated search history
 *   delete:
 *     summary: Remove query from authenticated user's search history
 *     tags:
 *       - Search
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated search history
 */
router.get("/search/history", authenticate, productController.getUserSearchHistory);
router.post("/search/history", authenticate, productController.addUserSearchHistory);
router.delete("/search/history", authenticate, productController.removeUserSearchHistory);
router.delete("/search/history/clear", authenticate, productController.clearUserSearchHistory);

/**
 * @swagger
 * /products/SUPER_ADMIN/all:
 *   get:
 *     summary: List all products with SUPER_ADMIN metrics (SUPER_ADMIN Only)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Full product list and catalog stats
 */
router.get(
  "/admin/all",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  productController.getAdminProducts
);

/**
 * @swagger
 * /products/user/highly-interested:
 *   get:
 *     summary: Get user's highly interested products (3+ visits)
 *     tags:
 *       - Products
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of products marked as highly interested
 */
router.get(
  "/user/highly-interested",
  authenticate,
  visitQueryValidator,
  validateRequest,
  visitController.getHighlyInterested
);

/**
 * @swagger
 * /products/{id}/visit:
 *   post:
 *     summary: Track product visit for authenticated user
 *     tags:
 *       - Products
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit recorded or duplicate detected
 */
router.post(
  "/:id/visit",
  authenticate,
  productIdParamValidator,
  validateRequest,
  visitController.trackVisit
);

/**
 * @swagger
 * /products/{id}/visit-status:
 *   get:
 *     summary: Get product visit status for authenticated user
 *     tags:
 *       - Products
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit count and high-interest status
 */
router.get(
  "/:id/visit-status",
  authenticate,
  productIdParamValidator,
  validateRequest,
  visitController.getVisitStatus
);

/**
 * @swagger
 * /products/slug/{slug}:
 *   get:
 *     summary: Get product details by slug (with related products)
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details and related products
 *       404:
 *         description: Product not found
 */
router.get(
  "/slug/:slug",
  productSlugParamValidator,
  productController.getProductBySlug
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get(
  "/:id",
  productIdParamValidator,
  productController.getProductById
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (SUPER_ADMIN Only)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               comparePrice:
 *                 type: number
 *               stock:
 *                 type: integer
 *               sku:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               categoryId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  createProductValidator,
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product details (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               comparePrice:
 *                 type: number
 *               stock:
 *                 type: integer
 *               sku:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               categoryId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  updateProductValidator,
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}/status:
 *   patch:
 *     summary: Toggle product visibility (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product status updated
 */
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  productIdParamValidator,
  productController.toggleProductStatus
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  productIdParamValidator,
  productController.deleteProduct
);

/**
 * @swagger
 * /products/{productId}/variants:
 *   get:
 *     summary: Get all variants for a product
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of variants
 */
router.get(
  "/:productId/variants",
  productController.getProductVariants
);

/**
 * @swagger
 * /products/{productId}/variants:
 *   post:
 *     summary: Create a product variant (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Variant created successfully
 */
router.post(
  "/:productId/variants",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  createVariantValidator,
  productController.createVariant
);

/**
 * @swagger
 * /products/variants/{variantId}:
 *   put:
 *     summary: Update a product variant (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variant updated successfully
 */
router.put(
  "/variants/:variantId",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  updateVariantValidator,
  productController.updateVariant
);

/**
 * @swagger
 * /products/variants/{variantId}:
 *   delete:
 *     summary: Delete a product variant (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variant deleted successfully
 */
router.delete(
  "/variants/:variantId",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  variantIdParamValidator,
  productController.deleteVariant
);

export default router;
