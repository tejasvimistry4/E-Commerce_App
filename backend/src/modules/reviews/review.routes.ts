import { Router } from "express";
import reviewController from "./review.controller";
import {
  createReviewValidator,
  updateReviewValidator,
  reviewIdParamValidator,
  productIdParamValidator,
  reviewFilterQueryValidator,
  adminReviewFilterQueryValidator,
  topReviewedProductsQueryValidator,
  updateReviewStatusValidator,
} from "./review.validator";
import { validateRequest } from "../../middleware/validate.middleware";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product ratings, customer reviews, and admin moderation
 */

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Get approved reviews and rating breakdown for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 */
router.get(
  "/product/:productId",
  productIdParamValidator,
  reviewFilterQueryValidator,
  validateRequest,
  reviewController.getProductReviews
);

/**
 * @swagger
 * /reviews/product/{productId}/my-review:
 *   get:
 *     summary: Get current authenticated user's review for a product
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User review status
 */
router.get(
  "/product/:productId/my-review",
  authenticate,
  productIdParamValidator,
  validateRequest,
  reviewController.getUserReviewForProduct
);

/**
 * @swagger
 * /reviews/product/{productId}:
 *   post:
 *     summary: Submit a review for a product
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 */
router.post(
  "/product/:productId",
  authenticate,
  createReviewValidator,
  validateRequest,
  reviewController.createReview
);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update an existing review by the reviewer
 *     tags: [Reviews]
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
 *         description: Review updated successfully
 */
router.put(
  "/:id",
  authenticate,
  updateReviewValidator,
  validateRequest,
  reviewController.updateReview
);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete review (by author or admin)
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  reviewIdParamValidator,
  validateRequest,
  reviewController.deleteReview
);

/**
 * Admin Moderation Routes
 */

/**
 * @swagger
 * /reviews/admin/stats:
 *   get:
 *     summary: Get reviews moderation metrics (Admin Only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin metrics retrieved
 */
router.get(
  "/admin/stats",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  reviewController.getReviewStatsAdmin
);

/**
 * @swagger
 * /reviews/admin/all:
 *   get:
 *     summary: List all reviews for moderation (Admin & Vendor)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews list retrieved
 */
router.get(
  "/admin/all",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  adminReviewFilterQueryValidator,
  validateRequest,
  reviewController.getAllReviewsAdmin
);

/**
 * @swagger
 * /reviews/admin/top-products:
 *   get:
 *     summary: Get top products ranked by total reviews count (Admin & Vendor)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top reviewed products retrieved
 */
router.get(
  "/admin/top-products",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  topReviewedProductsQueryValidator,
  validateRequest,
  reviewController.getTopReviewedProducts
);

/**
 * @swagger
 * /reviews/top-products:
 *   get:
 *     summary: Get top products ranked by total reviews count
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top reviewed products retrieved
 */
router.get(
  "/top-products",
  topReviewedProductsQueryValidator,
  validateRequest,
  reviewController.getTopReviewedProducts
);

/**
 * @swagger
 * /reviews/admin/{id}/status:
 *   patch:
 *     summary: Update review moderation status (Admin Only)
 *     tags: [Reviews]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Review status updated
 */
router.patch(
  "/admin/:id/status",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  updateReviewStatusValidator,
  validateRequest,
  reviewController.updateReviewStatusAdmin
);

/**
 * @swagger
 * /reviews/admin/{id}:
 *   delete:
 *     summary: Delete review permanently (Admin Only)
 *     tags: [Reviews]
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
 *         description: Review deleted by admin
 */
router.delete(
  "/admin/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  reviewIdParamValidator,
  validateRequest,
  reviewController.deleteReviewAdmin
);

export default router;
