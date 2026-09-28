import { Request, Response, NextFunction } from "express";
import reviewService from "./review.service";

export class ReviewController {
  /**
   * Public: Get approved reviews and summary stats for a product
   */
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const result = await reviewService.getProductReviews(productId, req.query as any);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Customer: Get current user's review and verified purchase eligibility
   */
  async getUserReviewForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const userId = (req as any).user?.id;
      const result = await reviewService.getUserReviewForProduct(userId, productId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Customer: Submit a new review
   */
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const userId = (req as any).user?.id;
      const review = await reviewService.createReview(userId, productId, req.body);
      res.status(201).json({
        success: true,
        message: "Your review has been submitted successfully!",
        data: review,
      });
    } catch (error: any) {
      if (error.message?.includes("already reviewed")) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Customer: Update own review
   */
  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.id;
      const review = await reviewService.updateReview(userId, id, req.body);
      res.status(200).json({
        success: true,
        message: "Your review has been updated successfully!",
        data: review,
      });
    } catch (error: any) {
      if (error.message?.includes("not authorized")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Customer / SUPER_ADMIN: Delete review
   */
  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const isSUPER_ADMIN = user?.role === "SUPER_ADMIN";
      await reviewService.deleteReview(user?.id, id, isSUPER_ADMIN);
      res.status(200).json({
        success: true,
        message: "Review deleted successfully.",
      });
    } catch (error: any) {
      if (error.message?.includes("not authorized")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Admin & Vendor: List reviews with search and filters
   */
  async getAllReviewsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const caller = (req as any).user ? { id: (req as any).user.id, role: (req as any).user.role } : undefined;
      const result = await reviewService.getAllReviewsAdmin(req.query as any, caller);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * SUPER_ADMIN: Update review moderation status
   */
  async updateReviewStatusAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const review = await reviewService.updateReviewStatusAdmin(id, status);
      res.status(200).json({
        success: true,
        message: `Review status changed to ${status}.`,
        data: review,
      });
    } catch (error: any) {
      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * SUPER_ADMIN: Delete review by SUPER_ADMIN
   */
  async deleteReviewAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await reviewService.deleteReview("", id, true);
      res.status(200).json({
        success: true,
        message: "Review removed successfully by administrator.",
      });
    } catch (error: any) {
      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Admin & Vendor: Get review metrics
   */
  async getReviewStatsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const caller = (req as any).user ? { id: (req as any).user.id, role: (req as any).user.role } : undefined;
      const stats = await reviewService.getReviewStatsAdmin(caller);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public / SUPER_ADMIN: Get top products ranked by total reviews count in descending order
   */
  async getTopReviewedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const result = await reviewService.getTopReviewedProducts(limit);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
export default reviewController;
