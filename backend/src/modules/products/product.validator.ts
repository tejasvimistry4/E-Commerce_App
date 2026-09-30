import { body, param, query } from "express-validator";

export const createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),

  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must contain lowercase alphanumeric characters and hyphens only"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("comparePrice")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Compare price must be a positive number"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be an integer 0 or greater"),

  body("sku")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU cannot exceed 100 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("thumbnail")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("Thumbnail must be a valid path string"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of image path strings"),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isUUID()
    .withMessage("Valid category UUID is required"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),

  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array of variant objects"),

  body("variants.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant price must be a positive number"),

  body("variants.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant stock must be an integer 0 or greater"),
];

export const updateProductValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid product UUID is required"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),

  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must contain lowercase alphanumeric characters and hyphens only"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("comparePrice")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Compare price must be a positive number"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be an integer 0 or greater"),

  body("sku")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU cannot exceed 100 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("thumbnail")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("Thumbnail must be a valid path string"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of image path strings"),

  body("categoryId")
    .optional()
    .isUUID()
    .withMessage("Valid category UUID is required"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),

  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array of variant objects"),
];

export const createVariantValidator = [
  param("productId")
    .isUUID()
    .withMessage("Valid product UUID is required"),

  body("price")
    .notEmpty()
    .withMessage("Variant price is required")
    .isFloat({ min: 0 })
    .withMessage("Variant price must be a positive number"),

  body("comparePrice")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Compare price must be a positive number"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be an integer 0 or greater"),

  body("sku")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU cannot exceed 100 characters"),

  body("attributes")
    .notEmpty()
    .withMessage("Variant attributes (e.g. Color, Size) are required")
    .isObject()
    .withMessage("Attributes must be a key-value object"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of image paths"),

  body("thumbnail")
    .optional({ nullable: true })
    .trim()
    .isString(),

  body("isActive")
    .optional()
    .isBoolean(),

  body("isDefault")
    .optional()
    .isBoolean(),
];

export const updateVariantValidator = [
  param("variantId")
    .isUUID()
    .withMessage("Valid variant UUID is required"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant price must be a positive number"),

  body("comparePrice")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Compare price must be a positive number"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be an integer 0 or greater"),

  body("sku")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU cannot exceed 100 characters"),

  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be a key-value object"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of image paths"),

  body("thumbnail")
    .optional({ nullable: true })
    .trim()
    .isString(),

  body("isActive")
    .optional()
    .isBoolean(),

  body("isDefault")
    .optional()
    .isBoolean(),
];

export const variantIdParamValidator = [
  param("variantId")
    .isUUID()
    .withMessage("Valid variant UUID is required"),
];

export const productIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Valid product UUID is required"),
];

export const productSlugParamValidator = [
  param("slug")
    .trim()
    .notEmpty()
    .withMessage("Product slug is required"),
];
