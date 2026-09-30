import { Router } from "express";
import { OrderController } from "./order.controller";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import {
  createOrderValidator,
  orderIdParamValidator,
  updateOrderStatusValidator,
  cancelOrderValidator,
  orderFilterQueryValidator,
  createReturnRequestValidator,
  returnIdParamValidator,
  updateReturnStatusValidator,
  verifyPaymentValidator,
  paymentFailedValidator,
} from "./order.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order checkout, payment verification, history, status tracking, returns, and SUPER_ADMIN management
 */

/**
 * Public Webhook Endpoint (Protected by HMAC SHA256 Signature Header)
 */
router.post("/webhook", OrderController.handleWebhook);

// All other order endpoints require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     summary: Create a new order from current cart (supports Cash on Delivery and Razorpay online payments)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post(
  "/checkout",
  createOrderValidator,
  validateRequest,
  OrderController.createOrder
);

/**
 * @swagger
 * /api/orders/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment signature and complete order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/verify-payment",
  verifyPaymentValidator,
  validateRequest,
  OrderController.verifyPayment
);

/**
 * @swagger
 * /api/orders/payment-failed:
 *   post:
 *     summary: Record Razorpay payment failure
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/payment-failed",
  paymentFailedValidator,
  validateRequest,
  OrderController.handlePaymentFailed
);

/**
 * @swagger
 * /api/orders/my-orders/{id}/retry-payment:
 *   post:
 *     summary: Retry payment for pending or failed order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/my-orders/:id/retry-payment",
  orderIdParamValidator,
  validateRequest,
  OrderController.retryPayment
);

/**
 * @swagger
 * /api/orders/addresses:
 *   get:
 *     summary: Get user's saved addresses
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get("/addresses", OrderController.getUserAddresses);


/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Get customer's order history
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/my-orders",
  orderFilterQueryValidator,
  validateRequest,
  OrderController.getMyOrders
);

/**
 * @swagger
 * /api/orders/my-returns:
 *   get:
 *     summary: Get customer's return requests
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/my-returns",
  orderFilterQueryValidator,
  validateRequest,
  OrderController.getMyReturns
);

/**
 * @swagger
 * /api/orders/my-orders/{id}:
 *   get:
 *     summary: Get single order detail for customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/my-orders/:id",
  orderIdParamValidator,
  validateRequest,
  OrderController.getMyOrderById
);

/**
 * @swagger
 * /api/orders/my-orders/{id}/pdf:
 *   get:
 *     summary: Download or preview Order Receipt PDF for customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order, invoice]
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: PDF file binary stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  "/my-orders/:id/pdf",
  orderIdParamValidator,
  validateRequest,
  OrderController.downloadMyOrderPdf
);

/**
 * @swagger
 * /api/orders/my-orders/{id}/invoice:
 *   get:
 *     summary: Download or preview official Tax Invoice PDF for customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: PDF file binary stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  "/my-orders/:id/invoice",
  orderIdParamValidator,
  validateRequest,
  OrderController.downloadMyOrderInvoice
);


/**
 * @swagger
 * /api/orders/my-orders/{id}/cancel:
 *   post:
 *     summary: Cancel order by customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/my-orders/:id/cancel",
  cancelOrderValidator,
  validateRequest,
  OrderController.cancelMyOrder
);

/**
 * @swagger
 * /api/orders/my-orders/{id}/return:
 *   post:
 *     summary: Request product return within 7 days of delivery
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/my-orders/:id/return",
  createReturnRequestValidator,
  validateRequest,
  OrderController.requestOrderReturn
);

/**
 * @swagger
 * /api/orders/my-orders/{id}/return:
 *   get:
 *     summary: Get return details for customer order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/my-orders/:id/return",
  orderIdParamValidator,
  validateRequest,
  OrderController.getMyOrderReturn
);

// --- Admin Protected Routes ---

/**
 * @swagger
 * /api/orders/admin/stats:
 *   get:
 *     summary: Get order KPI statistics for admin (SUPER_ADMIN Only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/stats",
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  OrderController.getOrderStatsAdmin
);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders for admin & vendor
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/all",
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  orderFilterQueryValidator,
  validateRequest,
  OrderController.getAllOrdersAdmin
);

/**
 * @swagger
 * /api/orders/admin/returns:
 *   get:
 *     summary: Get all return requests for admin (SUPER_ADMIN Only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/returns",
  authorizeRoles("SUPER_ADMIN"),
  orderFilterQueryValidator,
  validateRequest,
  OrderController.getAllReturnsAdmin
);

/**
 * @swagger
 * /api/orders/admin/returns/{id}:
 *   get:
 *     summary: Get return request detail for admin (SUPER_ADMIN Only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/returns/:id",
  authorizeRoles("SUPER_ADMIN"),
  returnIdParamValidator,
  validateRequest,
  OrderController.getReturnByIdAdmin
);

/**
 * @swagger
 * /api/orders/admin/returns/{id}/status:
 *   patch:
 *     summary: Update return request status by admin (SUPER_ADMIN Only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/admin/returns/:id/status",
  authorizeRoles("SUPER_ADMIN"),
  updateReturnStatusValidator,
  validateRequest,
  OrderController.updateReturnStatusAdmin
);

/**
 * @swagger
 * /api/orders/admin/{id}:
 *   get:
 *     summary: Get single order details for admin & vendor
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/:id",
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  orderIdParamValidator,
  validateRequest,
  OrderController.getOrderByIdAdmin
);

/**
 * @swagger
 * /api/orders/admin/{id}/pdf:
 *   get:
 *     summary: Download or preview Order Receipt PDF for Admin & Vendor
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order, invoice]
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: PDF file binary stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  "/admin/:id/pdf",
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  orderIdParamValidator,
  validateRequest,
  OrderController.downloadAdminOrderPdf
);

/**
 * @swagger
 * /api/orders/admin/{id}/invoice:
 *   get:
 *     summary: Download or preview official Tax Invoice PDF for Admin & Vendor
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: PDF file binary stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  "/admin/:id/invoice",
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  orderIdParamValidator,
  validateRequest,
  OrderController.downloadAdminOrderInvoice
);


/**
 * @swagger
 * /api/orders/admin/{id}/status:
 *   patch:
 *     summary: Update order status by admin (SUPER_ADMIN Only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/admin/:id/status",
  authorizeRoles("SUPER_ADMIN"),
  updateOrderStatusValidator,
  validateRequest,
  OrderController.updateOrderStatusAdmin
);

export default router;

