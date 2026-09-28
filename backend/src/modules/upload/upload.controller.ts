import { Request, Response, NextFunction } from "express";

export class UploadController {
  /**
   * POST /api/upload/single
   * Upload single image (for Category or Product thumbnail)
   */
  uploadSingleImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided in 'image' field.",
        });
      }

      const relativePath = `/uploads/${req.file.filename}`;

      return res.status(201).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: relativePath,
          path: relativePath,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/upload/multiple
   * Upload multiple images (for Product gallery)
   */
  uploadMultipleImages(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No image files provided in 'images' field.",
        });
      }

      const uploadedFiles = files.map((file) => {
        const relativePath = `/uploads/${file.filename}`;
        return {
          url: relativePath,
          path: relativePath,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      });

      const urls = uploadedFiles.map((f) => f.url);

      return res.status(201).json({
        success: true,
        message: `${files.length} images uploaded successfully`,
        data: {
          urls,
          files: uploadedFiles,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
