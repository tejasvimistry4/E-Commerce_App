import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { paymentController } from "./payment.controller";
import {
  verifyPaymentValidator,
  paymentFailedValidator,
  retryPaymentValidator,
} from "./payment.validator";

const router = Router();

/**
 * @route   POST /api/payments/verify (or /api/payments/verify-payment)
 * @desc    Cryptographically verify Razorpay signature and finalize order
 * @access  Private (Authenticated User)
 */
router.post(
  "/verify",
  authenticate as any,
  verifyPaymentValidator,
  paymentController.verifyPayment.bind(paymentController)
);
router.post(
  "/verify-payment",
  authenticate as any,
  verifyPaymentValidator,
  paymentController.verifyPayment.bind(paymentController)
);

/**
 * @route   POST /api/payments/failed (or /api/payments/payment-failed)
 * @desc    Record client-side Razorpay payment failure
 * @access  Private (Authenticated User)
 */
router.post(
  "/failed",
  authenticate as any,
  paymentFailedValidator,
  paymentController.paymentFailed.bind(paymentController)
);
router.post(
  "/payment-failed",
  authenticate as any,
  paymentFailedValidator,
  paymentController.paymentFailed.bind(paymentController)
);

/**
 * @route   POST /api/payments/retry/:id
 * @desc    Generate a fresh Razorpay order for an existing pending/failed order
 * @access  Private (Authenticated User)
 */
router.post(
  "/retry/:id",
  authenticate as any,
  retryPaymentValidator,
  paymentController.retryPayment.bind(paymentController)
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay asynchronous server-to-server webhook
 * @access  Public (Signature Verified)
 */
router.post("/webhook", paymentController.handleWebhook.bind(paymentController));

export default router;
