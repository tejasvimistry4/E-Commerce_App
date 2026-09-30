import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import uploadController from "./upload.controller";
import { uploadSingle, uploadMultiple } from "../../middleware/upload.middleware";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// Wrapper to handle Multer errors cleanly
const handleSingleUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadSingle(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size exceeds limit of 10MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload file.",
      });
    }
    next();
  });
};

const handleMultipleUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadMultiple(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "One or more files exceed limit of 10MB.",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Maximum 10 images allowed per upload.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload files.",
      });
    }
    next();
  });
};

/**
 * @swagger
 * /upload/single:
 *   post:
 *     summary: Upload a single image
 *     tags:
 *       - Upload
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 */
router.post("/single", authenticate, handleSingleUpload, uploadController.uploadSingleImage);

/**
 * @swagger
 * /upload/multiple:
 *   post:
 *     summary: Upload multiple images
 *     tags:
 *       - Upload
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 */
router.post("/multiple", authenticate, handleMultipleUpload, uploadController.uploadMultipleImages);

export default router;
