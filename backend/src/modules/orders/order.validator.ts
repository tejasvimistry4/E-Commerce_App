import { body, param, query } from "express-validator";
import { OrderStatus, PaymentMethod, PaymentStatus, ReturnStatus } from "@prisma/client";

export const createOrderValidator = [
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required")
    .isObject()
    .withMessage("Shipping address must be an object"),

  body("shippingAddress.fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required for delivery")
    .isLength({ min: 2 })
    .withMessage("Full name must be at least 2 characters"),

  body("shippingAddress.phone")
    .trim()
    .notEmpty()
    .withMessage("Contact phone number is required")
    .matches(/^[0-9+\s-]{7,15}$/)
    .withMessage("Please provide a valid contact number"),

  body("shippingAddress.streetAddress")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),

  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("State / Province is required"),

  body("shippingAddress.postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal / PIN code is required"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method selection is required")
    .isIn(Object.values(PaymentMethod))
    .withMessage(`Payment method must be one of: ${Object.values(PaymentMethod).join(", ")}`),

  body("couponCode")
    .optional({ nullable: true })
    .isString()
    .trim(),

  body("notes")
    .optional({ nullable: true })
    .isString()
    .trim(),

  body("saveAddress")
    .optional()
    .isBoolean()
    .withMessage("saveAddress must be a boolean value"),
];

export const orderIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid order UUID is required"),
];

export const updateOrderStatusValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid order UUID is required"),

  body("status")
    .notEmpty()
    .withMessage("Order status is required")
    .isIn(Object.values(OrderStatus))
    .withMessage(`Status must be one of: ${Object.values(OrderStatus).join(", ")}`),

  body("paymentStatus")
    .optional()
    .isIn(Object.values(PaymentStatus))
    .withMessage(`Payment status must be one of: ${Object.values(PaymentStatus).join(", ")}`),

  body("notes")
    .optional({ nullable: true })
    .isString()
    .trim(),
];

export const cancelOrderValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid order UUID is required"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Cancellation reason is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("Reason must be between 3 and 500 characters"),
];

export const createReturnRequestValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid order UUID is required"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Return reason is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Reason must be between 2 and 200 characters"),

  body("details")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Additional details must not exceed 1000 characters"),
];

export const returnIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid return request UUID is required"),
];

export const updateReturnStatusValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid return request UUID is required"),

  body("status")
    .notEmpty()
    .withMessage("Return status is required")
    .isIn(Object.values(ReturnStatus))
    .withMessage(`Status must be one of: ${Object.values(ReturnStatus).join(", ")}`),

  body("adminComment")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin comment must not exceed 1000 characters"),
];

export {
  verifyPaymentValidator,
  paymentFailedValidator,
  retryPaymentValidator,
} from "../payments/payment.validator";


export const orderFilterQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isString(),

  query("search")
    .optional()
    .isString(),
];



