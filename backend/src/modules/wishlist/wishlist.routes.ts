import { Router } from "express";
import wishlistController from "./wishlist.controller";
import {
  addToWishlistValidator,
  toggleWishlistValidator,
  productIdParamValidator,
} from "./wishlist.validator";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// All wishlist operations require authentication
router.use(authenticate);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get current authenticated user's wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist items list and total count
 *       401:
 *         description: Unauthorized - Login required
 */
router.get("/", wishlistController.getWishlist);

/**
 * @swagger
 * /wishlist/toggle:
 *   post:
 *     summary: Toggle product in user's wishlist (add if missing, remove if present)
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Toggle result with updated status and full wishlist
 *       400:
 *         description: Invalid productId or product unavailable
 */
router.post("/toggle", toggleWishlistValidator, wishlistController.toggleWishlist);

/**
 * @swagger
 * /wishlist/items:
 *   post:
 *     summary: Add product to user's wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Product added and updated wishlist returned
 *       400:
 *         description: Invalid productId or product unavailable
 */
router.post("/items", addToWishlistValidator, wishlistController.addToWishlist);

/**
 * @swagger
 * /wishlist/items/{productId}:
 *   delete:
 *     summary: Remove product from user's wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product removed and updated wishlist returned
 *       400:
 *         description: Invalid productId
 */
router.delete(
  "/items/:productId",
  productIdParamValidator,
  wishlistController.removeFromWishlist
);

/**
 * @swagger
 * /wishlist/clear:
 *   delete:
 *     summary: Clear all items in user's wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared
 */
router.delete("/clear", wishlistController.clearWishlist);

export default router;
