import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import cartService from "./cart.service";

export class CartController {
  /**
   * GET /api/cart - Get user's cart with items and summary
   */
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cart = await cartService.getCart(userId);

      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/cart/items - Add item to cart
   */
  async addToCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;
      const { productId, variantId, quantity } = req.body;

      const cart = await cartService.addToCart(userId, { productId, variantId, quantity });

      return res.status(200).json({
        success: true,
        message: "Item added to cart successfully",
        data: cart,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to add item to cart",
      });
    }
  }

  /**
   * PUT /api/cart/items/:id - Update item quantity
   */
  async updateCartItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;
      const cartItemId = req.params.id as string;
      const { quantity } = req.body;

      const cart = await cartService.updateCartItemQuantity(
        userId,
        cartItemId,
        Number(quantity)
      );

      return res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        data: cart,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update cart item",
      });
    }
  }

  /**
   * DELETE /api/cart/items/:id - Remove item from cart
   */
  async removeFromCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;
      const cartItemId = req.params.id as string;

      const cart = await cartService.removeFromCart(userId, cartItemId);

      return res.status(200).json({
        success: true,
        message: "Item removed from cart",
        data: cart,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to remove item from cart",
      });
    }
  }

  /**
   * DELETE /api/cart/clear - Empty user's cart
   */
  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cart = await cartService.clearCart(userId);

      return res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        data: cart,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to clear cart",
      });
    }
  }

  /**
   * POST /api/cart/sync - Merge guest cart items into database cart
   */
  async syncCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;
      const { items } = req.body;

      const cart = await cartService.syncGuestCart(userId, { items });

      return res.status(200).json({
        success: true,
        message: "Cart synced successfully",
        data: cart,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to sync cart",
      });
    }
  }
}

export default new CartController();
