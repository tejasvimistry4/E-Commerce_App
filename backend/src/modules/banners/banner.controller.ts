import { Request, Response, NextFunction } from "express";
import bannerService from "./banner.service";

export class BannerController {
  /**
   * Public: Get currently active & scheduled banners
   */
  async getActiveBanners(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await bannerService.getActiveBanners();
      res.status(200).json({
        success: true,
        data: banners,
        count: banners.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List all banners with search & filters
   */
  async getAllBannersAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bannerService.getAllBannersAdmin(req.query as any);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get single banner details
   */
  async getBannerById(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.getBannerById(req.params.id as string);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: "Banner not found.",
        });
      }
      res.status(200).json({
        success: true,
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Create new banner
   */
  async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.createBanner(req.body);
      res.status(201).json({
        success: true,
        message: "Banner created successfully.",
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update existing banner
   */
  async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.updateBanner(req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        message: "Banner updated successfully.",
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Toggle banner active/inactive status
   */
  async toggleBannerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.toggleBannerStatus(req.params.id as string);
      res.status(200).json({
        success: true,
        message: `Banner status set to ${banner.isActive ? "active" : "inactive"}.`,
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Delete banner
   */
  async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.deleteBanner(req.params.id as string);
      res.status(200).json({
        success: true,
        message: `Banner "${banner.title}" deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bannerController = new BannerController();
export default bannerController;
