import { body, param } from "express-validator";

export const addToCartValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Valid product UUID is required"),

  body("variantId")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Variant ID must be a valid UUID"),

  body("quantity")
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage("Quantity must be an integer between 1 and 99"),
];

export const updateCartItemValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid cart item UUID is required"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0, max: 99 })
    .withMessage("Quantity must be an integer between 0 and 99"),
];

export const cartItemIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid cart item UUID is required"),
];

export const syncCartValidator = [
  body("items")
    .isArray()
    .withMessage("Items must be an array of cart items"),

  body("items.*.productId")
    .notEmpty()
    .withMessage("Each item must have a valid productId")
    .isUUID()
    .withMessage("Valid product UUID is required"),

  body("items.*.variantId")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Variant ID must be a valid UUID"),

  body("items.*.quantity")
    .isInt({ min: 1, max: 99 })
    .withMessage("Quantity must be an integer between 1 and 99"),
];
