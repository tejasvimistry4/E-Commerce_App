import { Request, Response, NextFunction } from "express";
import visualSearchService from "./visualSearch.service";

export class VisualSearchController {
  /**
   * POST /api/products/visual-search - Search products using an uploaded image
   */
  async searchByImage(req: Request, res: Response, next: NextFunction) {
    try {
      let imageBuffer: Buffer | null = null;
      let imagePath: string | null = null;

      if (req.file) {
        imageBuffer = req.file.buffer || null;
        imagePath = req.file.path || null;
      } else if (req.body && req.body.image) {
        imagePath = req.body.image;
      } else if (req.body && req.body.imageUrl) {
        imagePath = req.body.imageUrl;
      }

      if (!imageBuffer && !imagePath) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image or provide an image URL.",
        });
      }

      // Generate query embedding
      const queryVector = await visualSearchService.extractImageEmbedding(
        imageBuffer || imagePath!
      );

      const {
        limit,
        threshold,
        categoryId,
        categorySlug,
        minPrice,
        maxPrice,
        inStockOnly,
      } = req.query;

      const results = await visualSearchService.findSimilarProducts(queryVector, {
        limit: limit ? Number(limit) : 12,
        threshold: threshold !== undefined ? Number(threshold) : 0.90,
        categoryId: categoryId as string,
        categorySlug: categorySlug as string,
        minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
        inStockOnly: inStockOnly !== undefined ? inStockOnly === "true" : undefined,
      });

      return res.status(200).json({
        success: true,
        data: results,
        total: results.length,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/products/admin/sync-embeddings - Re-index all product embeddings (Admin Only)
   */
  async syncEmbeddings(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await visualSearchService.syncAllProductEmbeddings();

      return res.status(200).json({
        success: true,
        message: `Successfully indexed ${stats.indexedCount} images across ${stats.totalProducts} products.`,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new VisualSearchController();
