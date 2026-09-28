import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import wishlistService from "./wishlist.service";

export class WishlistController {
  /**
   * GET /api/wishlist - Get current user's wishlist
   */
  async getWishlist(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;
      const wishlist = await wishlistService.getWishlist(userId);

      return res.status(200).json({
        success: true,
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wishlist/items - Add product to wishlist
   */
  async addToWishlist(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;
      const { productId, variantId } = req.body;

      const wishlist = await wishlistService.addToWishlist(userId, productId, variantId);

      return res.status(200).json({
        success: true,
        message: "Item added to wishlist successfully",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to add item to wishlist",
      });
    }
  }

  /**
   * DELETE /api/wishlist/items/:productId - Remove product from wishlist
   */
  async removeFromWishlist(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;
      const productId = req.params.productId as string;
      const variantId = req.query.variantId as string | undefined;

      const wishlist = await wishlistService.removeFromWishlist(
        userId,
        productId,
        variantId
      );

      return res.status(200).json({
        success: true,
        message: "Item removed from wishlist",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to remove item from wishlist",
      });
    }
  }

  /**
   * POST /api/wishlist/toggle - Toggle product in wishlist
   */
  async toggleWishlist(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;
      const { productId, variantId } = req.body;

      const result = await wishlistService.toggleWishlist(userId, productId, variantId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle wishlist item",
      });
    }
  }

  /**
   * DELETE /api/wishlist/clear - Clear all items in wishlist
   */
  async clearWishlist(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;
      const wishlist = await wishlistService.clearWishlist(userId);

      return res.status(200).json({
        success: true,
        message: "Wishlist cleared successfully",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to clear wishlist",
      });
    }
  }
}

export default new WishlistController();
