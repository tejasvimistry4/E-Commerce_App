import { Router } from "express";
import cartController from "./cart.controller";
import {
  addToCartValidator,
  updateCartItemValidator,
  cartItemIdParamValidator,
  syncCartValidator,
} from "./cart.validator";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// All cart operations require authentication
router.use(authenticate);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user shopping cart with live totals
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Shopping cart data and financial calculations
 *       401:
 *         description: Unauthorized
 */
router.get("/", cartController.getCart);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add product to cart
 *     tags:
 *       - Cart
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
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Product added and updated cart returned
 *       400:
 *         description: Out of stock or invalid quantity
 */
router.post("/items", addToCartValidator, cartController.addToCart);

/**
 * @swagger
 * /cart/items/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put("/items/:id", updateCartItemValidator, cartController.updateCartItem);

/**
 * @swagger
 * /cart/items/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags:
 *       - Cart
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
 *         description: Item removed from cart
 */
router.delete("/items/:id", cartItemIdParamValidator, cartController.removeFromCart);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear all items in cart
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart emptied
 */
router.delete("/clear", cartController.clearCart);

/**
 * @swagger
 * /cart/sync:
 *   post:
 *     summary: Sync guest cart items into database cart on login
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Merged cart returned
 */
router.post("/sync", syncCartValidator, cartController.syncCart);

export default router;
