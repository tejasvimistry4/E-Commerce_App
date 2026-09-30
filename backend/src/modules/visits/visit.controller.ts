import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import visitService from "./visit.service";

export class VisitController {
  /**
   * 1. Record / Track product visit for the authenticated user
   * POST /api/visits/track or POST /api/products/:productId/visit
   */
  async trackVisit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to track product visits.",
        });
      }

      const rawProductId =
        req.params.productId || req.params.id || req.body.productId;
      const productId = Array.isArray(rawProductId)
        ? rawProductId[0]
        : (rawProductId as string);

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required.",
        });
      }

      const result = await visitService.trackProductVisit(userId, productId);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && error.message.includes("inactive")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * 2. Get visit status for a product for authenticated user
   * GET /api/visits/status/:productId or GET /api/products/:productId/visit-status
   */
  async getVisitStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to view visit status.",
        });
      }

      const rawProductId = req.params.productId || req.params.id;
      const productId = Array.isArray(rawProductId)
        ? rawProductId[0]
        : (rawProductId as string);

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required.",
        });
      }

      const result = await visitService.getProductVisitStatus(userId, productId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Get all Highly Interested products for the authenticated user
   * GET /api/visits/highly-interested or GET /api/products/user/highly-interested
   */
  async getHighlyInterested(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to view highly interested products.",
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await visitService.getHighlyInterestedProducts(userId, limit);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. Get recent visits for customer dashboard
   * GET /api/visits/recent
   */
  async getRecentVisits(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to view recent visits.",
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
      const result = await visitService.getUserRecentVisits(userId, limit);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // SUPER_ADMIN DASHBOARD CONTROLLERS
  // ==========================================

  /**
   * 5. SUPER_ADMIN / VENDOR: List all user-by-product visit records with search & filters
   * GET /api/visits/admin/all
   */
  async getAdminVisits(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        page,
        limit,
        search,
        isHighlyInterested,
        sortBy,
        sortOrder,
        categoryId,
        userId,
        productId,
      } = req.query;

      const result = await visitService.getAdminVisits(
        {
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 15,
          search: search ? String(search) : undefined,
          isHighlyInterested: isHighlyInterested as any,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any,
          categoryId: categoryId ? String(categoryId) : undefined,
          userId: userId ? String(userId) : undefined,
          productId: productId ? String(productId) : undefined,
        },
        req.user
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. SUPER_ADMIN / VENDOR: Products Ranked by Total Visits Report
   * GET /api/visits/admin/ranked-products
   */
  async getAdminRankedProducts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { search, categoryId, sortBy, sortOrder, limit } = req.query;

      const result = await visitService.getAdminRankedProducts(
        {
          search: search ? String(search) : undefined,
          categoryId: categoryId ? String(categoryId) : undefined,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any,
          limit: limit ? Number(limit) : 50,
        },
        req.user
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new VisitController();
