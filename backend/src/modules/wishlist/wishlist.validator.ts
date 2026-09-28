import { body, param } from "express-validator";

export const addToWishlistValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),

  body("variantId")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Variant ID must be a valid UUID"),
];

export const toggleWishlistValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),

  body("variantId")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Variant ID must be a valid UUID"),
];

export const productIdParamValidator = [
  param("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),
];
