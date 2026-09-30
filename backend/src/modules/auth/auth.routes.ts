import { Router } from "express";
import {
  register,
  registerVendorController,
  login,
  googleAuth,
  getMe,
  getUsers,
  getVendors,
  getVendorByIdController,
  updateVendorStatusController,
  getVendorStatsController,
} from "./auth.controller";
import {
  registerValidator,
  vendorRegisterValidator,
  vendorStatusValidator,
  loginValidator,
  googleAuthValidator,
} from "./auth.validator";
import { validateRequest } from "../../middleware/validate.middleware";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (Customer)
 *     description: Creates a new customer account and returns user data with JWT token. Role is always USER.
 *     tags:
 *       - Auth
 */
router.post(
  "/register",
  registerValidator,
  validateRequest,
  register
);

/**
 * @swagger
 * /auth/vendor/register:
 *   post:
 *     summary: Register a new Vendor (Admin)
 *     description: Registers a new vendor account with pending status until approved by Super Admin.
 *     tags:
 *       - Auth
 */
router.post(
  "/vendor/register",
  vendorRegisterValidator,
  validateRequest,
  registerVendorController
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user (Customer, Vendor, or Admin)
 *     description: Authenticates user credentials, validates status (for vendors), and returns a JWT access token.
 *     tags:
 *       - Auth
 */
router.post(
  "/login",
  loginValidator,
  validateRequest,
  login
);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate via Google OAuth (Sign-Up / Sign-In)
 *     description: Verifies Google ID token, creates or links user account, and returns JWT access token.
 *     tags:
 *       - Auth
 */
router.post(
  "/google",
  googleAuthValidator,
  validateRequest,
  googleAuth
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     description: Returns details of the currently authenticated user based on the Bearer token.
 *     tags:
 *       - Auth
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/me",
  authenticate,
  getMe
);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: List all users (SUPER_ADMIN Only)
 *     description: Returns list of registered users. Requires SUPER_ADMIN authorization.
 *     tags:
 *       - Auth
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/users",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getUsers
);

// ==========================================
// SUPER ADMIN VENDOR MANAGEMENT ROUTES
// ==========================================

/**
 * @swagger
 * /auth/admin/vendors:
 *   get:
 *     summary: List all vendors with status and metrics (SUPER_ADMIN Only)
 *     tags:
 *       - Auth
 */
router.get(
  "/admin/vendors",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getVendors
);

/**
 * @swagger
 * /auth/admin/vendors/{id}:
 *   get:
 *     summary: Get vendor details by ID (SUPER_ADMIN Only)
 *     tags:
 *       - Auth
 */
router.get(
  "/admin/vendors/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getVendorByIdController
);

/**
 * @swagger
 * /auth/admin/vendors/{id}/status:
 *   patch:
 *     summary: Approve, reject, deactivate, or reactivate a vendor (SUPER_ADMIN Only)
 *     tags:
 *       - Auth
 */
router.patch(
  "/admin/vendors/:id/status",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  vendorStatusValidator,
  validateRequest,
  updateVendorStatusController
);

// ==========================================
// VENDOR PORTAL DASHBOARD ROUTE
// ==========================================

/**
 * @swagger
 * /auth/vendor/stats:
 *   get:
 *     summary: Get vendor dashboard statistics and overview metrics (VENDOR or SUPER_ADMIN)
 *     tags:
 *       - Auth
 */
router.get(
  "/vendor/stats",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  getVendorStatsController
);

export default router;