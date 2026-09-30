import { Router } from "express";
import visitController from "./visit.controller";
import {
  productIdParamValidator,
  visitQueryValidator,
  adminVisitsQueryValidator,
  adminRankedQueryValidator,
} from "./visit.validator";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";

const router = Router();

// All visit tracking endpoints require user authentication
router.use(authenticate);

/**
 * @swagger
 * /visits/track:
 *   post:
 *     summary: Track a product visit for the authenticated user
 *     tags:
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Visit tracked with genuine status and visit count
 *       400:
 *         description: Missing or invalid product ID
 *       401:
 *         description: Authentication required
 */
router.post("/track", visitController.trackVisit);

/**
 * @swagger
 * /visits/track/{productId}:
 *   post:
 *     summary: Track a product visit via path parameter
 *     tags:
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit tracked with genuine status and visit count
 */
router.post(
  "/track/:productId",
  productIdParamValidator,
  validateRequest,
  visitController.trackVisit
);

/**
 * @swagger
 * /visits/status/{productId}:
 *   get:
 *     summary: Get visit tracking status for a product for current user
 *     tags:
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product visit status, visit count, and isHighlyInterested flag
 */
router.get(
  "/status/:productId",
  productIdParamValidator,
  validateRequest,
  visitController.getVisitStatus
);

/**
 * @swagger
 * /visits/highly-interested:
 *   get:
 *     summary: Get all products marked as Highly Interested for authenticated user
 *     tags:
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of highly interested products
 */
router.get(
  "/highly-interested",
  visitQueryValidator,
  validateRequest,
  visitController.getHighlyInterested
);

/**
 * @swagger
 * /visits/recent:
 *   get:
 *     summary: Get recently visited products for authenticated user
 *     tags:
 *       - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: List of recently visited products
 */
router.get(
  "/recent",
  visitQueryValidator,
  validateRequest,
  visitController.getRecentVisits
);

// ============================================================================
// SUPER_ADMIN & VENDOR DASHBOARD ROUTES
// ============================================================================

/**
 * @swagger
 * /visits/admin/all:
 *   get:
 *     summary: List all user product visit records with filters, search, and pagination
 *     tags:
 *       - Admin - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isHighlyInterested
 *         schema:
 *           type: string
 *           enum: [all, true, false]
 *           default: all
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latestVisit, firstVisit, visitCount, userName, productName]
 *           default: latestVisit
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated product visits list with lead metrics
 */
router.get(
  "/admin/all",
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  adminVisitsQueryValidator,
  validateRequest,
  visitController.getAdminVisits
);

/**
 * @swagger
 * /visits/admin/ranked-products:
 *   get:
 *     summary: Get products ranked by highest total visits overall with unique visitor counts
 *     tags:
 *       - Admin - Visits
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [totalVisits, uniqueVisitors, highlyInterestedCount, latestVisit, name, price]
 *           default: totalVisits
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aggregated ranked product visits report
 */
router.get(
  "/admin/ranked-products",
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  adminRankedQueryValidator,
  validateRequest,
  visitController.getAdminRankedProducts
);

export default router;
