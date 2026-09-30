import { Router } from "express";
import bannerController from "./banner.controller";
import {
  createBannerValidator,
  updateBannerValidator,
  bannerIdParamValidator,
  bannerFilterQueryValidator,
} from "./banner.validator";
import { validateRequest } from "../../middleware/validate.middleware";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Dynamic homepage banners for festivals, seasonal campaigns, and active sales
 */

/**
 * @swagger
 * /banners/active:
 *   get:
 *     summary: Get currently active & scheduled banners (Storefront)
 *     description: Returns active banners whose scheduling window (start/end dates) matches the current time.
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of active banners
 */
router.get("/active", bannerController.getActiveBanners);

/**
 * @swagger
 * /banners/admin/all:
 *   get:
 *     summary: List all banners with admin filters & pagination (Admin Only)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [FESTIVAL, SEASONAL, SALE, PROMOTIONAL, GENERAL]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 */
router.get(
  "/admin/all",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  bannerFilterQueryValidator,
  validateRequest,
  bannerController.getAllBannersAdmin
);

/**
 * @swagger
 * /banners/{id}:
 *   get:
 *     summary: Get single banner details (Admin Only)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner details
 *       404:
 *         description: Banner not found
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  bannerIdParamValidator,
  validateRequest,
  bannerController.getBannerById
);

/**
 * @swagger
 * /banners:
 *   post:
 *     summary: Create a new promotional banner (Admin Only)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [FESTIVAL, SEASONAL, SALE, PROMOTIONAL, GENERAL]
 *               badgeText:
 *                 type: string
 *               buttonText:
 *                 type: string
 *               link:
 *                 type: string
 *               image:
 *                 type: string
 *               bgGradient:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Banner created successfully
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  createBannerValidator,
  validateRequest,
  bannerController.createBanner
);

/**
 * @swagger
 * /banners/{id}:
 *   put:
 *     summary: Update an existing banner (Admin Only)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner updated successfully
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  updateBannerValidator,
  validateRequest,
  bannerController.updateBanner
);

/**
 * @swagger
 * /banners/{id}/status:
 *   patch:
 *     summary: Toggle banner active/inactive status (Admin Only)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner status toggled
 */
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  bannerIdParamValidator,
  validateRequest,
  bannerController.toggleBannerStatus
);

/**
 * @swagger
 * /banners/{id}:
 *   delete:
 *     summary: Delete a banner (Admin Only)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  bannerIdParamValidator,
  validateRequest,
  bannerController.deleteBanner
);

export default router;
