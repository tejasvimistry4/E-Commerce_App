import { Router } from "express";
import * as categoryController from "./category.controller";
import {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdParamValidator,
  categorySlugParamValidator,
} from "./category.validator";
import { validateRequest } from "../../middleware/validate.middleware";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all active categories (Storefront)
 *     tags:
 *       - Categories
 */
router.get("/", categoryController.getCategories);

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Get hierarchical category tree
 *     tags:
 *       - Categories
 */
router.get("/tree", categoryController.getCategoryTree);

/**
 * @swagger
 * /categories/admin/all:
 *   get:
 *     summary: List all categories for Admin & Vendor
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/admin/all",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  categoryController.getAdminCategories
);

/**
 * @swagger
 * /categories/slug/{slug}:
 *   get:
 *     summary: Get category by URL slug
 *     tags:
 *       - Categories
 */
router.get(
  "/slug/:slug",
  categorySlugParamValidator,
  validateRequest,
  categoryController.getCategoryBySlug
);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Categories
 */
router.get(
  "/:id",
  categoryIdParamValidator,
  validateRequest,
  categoryController.getCategoryById
);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create new category or subcategory (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  createCategoryValidator,
  validateRequest,
  categoryController.createCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  updateCategoryValidator,
  validateRequest,
  categoryController.updateCategory
);

/**
 * @swagger
 * /categories/{id}/status:
 *   patch:
 *     summary: Toggle category active/inactive status (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  categoryIdParamValidator,
  validateRequest,
  categoryController.toggleCategoryStatus
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category (SUPER_ADMIN or VENDOR)
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  categoryIdParamValidator,
  validateRequest,
  categoryController.deleteCategory
);

export default router;
