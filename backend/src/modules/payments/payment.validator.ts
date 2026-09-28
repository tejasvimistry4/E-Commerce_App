import { body, param } from "express-validator";

export const verifyPaymentValidator = [
  body("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .isUUID()
    .withMessage("Order ID must be a valid UUID"),

  body("razorpay_order_id")
    .trim()
    .notEmpty()
    .withMessage("Razorpay Order ID (razorpay_order_id) is required"),

  body("razorpay_payment_id")
    .trim()
    .notEmpty()
    .withMessage("Razorpay Payment ID (razorpay_payment_id) is required"),

  body("razorpay_signature")
    .trim()
    .notEmpty()
    .withMessage("Razorpay Signature (razorpay_signature) is required"),
];

export const paymentFailedValidator = [
  body("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .isUUID()
    .withMessage("Order ID must be a valid UUID"),

  body("errorReason")
    .optional({ nullable: true })
    .isString()
    .trim(),

  body("errorCode")
    .optional({ nullable: true })
    .isString()
    .trim(),

  body("paymentId")
    .optional({ nullable: true })
    .isString()
    .trim(),
];

export const retryPaymentValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isUUID()
    .withMessage("Order ID must be a valid UUID"),
];
