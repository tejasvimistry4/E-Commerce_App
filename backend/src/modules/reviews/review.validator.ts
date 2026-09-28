import { body, param, query } from "express-validator";

const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export const createReviewValidator = [
  param("productId")
    .trim()
    .isUUID()
    .withMessage("Invalid product ID format."),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required.")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5.")
    .toInt(),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required.")
    .isLength({ min: 3, max: 2000 })
    .withMessage("Comment must be between 3 and 2000 characters."),

  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Review title cannot exceed 120 characters."),

  body("images")
    .optional()
    .isArray({ max: 8 })
    .withMessage("Images must be an array with at most 8 items."),

  body("images.*")
    .optional()
    .trim()
    .isString()
    .withMessage("Each image must be a valid string URL or path."),
];

export const updateReviewValidator = [
  param("id")
    .trim()
    .isUUID()
    .withMessage("Invalid review ID format."),

  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5.")
    .toInt(),

  body("comment")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Review comment cannot be empty.")
    .isLength({ min: 3, max: 2000 })
    .withMessage("Comment must be between 3 and 2000 characters."),

  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Review title cannot exceed 120 characters."),

  body("images")
    .optional()
    .isArray({ max: 8 })
    .withMessage("Images must be an array with at most 8 items."),

  body("images.*")
    .optional()
    .trim()
    .isString()
    .withMessage("Each image must be a valid string URL or path."),
];

export const reviewIdParamValidator = [
  param("id")
    .trim()
    .isUUID()
    .withMessage("Invalid review ID format (UUID expected)."),
];

export const productIdParamValidator = [
  param("productId")
    .trim()
    .isUUID()
    .withMessage("Invalid product ID format (UUID expected)."),
];

export const reviewFilterQueryValidator = [
  query("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating filter must be between 1 and 5.")
    .toInt(),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "rating"])
    .withMessage("sortBy must be one of: createdAt, rating."),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be either 'asc' or 'desc'."),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt(),
];

export const adminReviewFilterQueryValidator = [
  query("search")
    .optional()
    .trim()
    .isString(),

  query("status")
    .optional()
    .isIn(REVIEW_STATUSES)
    .withMessage(`Status must be one of: ${REVIEW_STATUSES.join(", ")}`),

  query("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .toInt(),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),

  query("topProductsOnly")
    .optional()
    .isBoolean()
    .toBoolean(),
];

export const topReviewedProductsQueryValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt(),
];

export const updateReviewStatusValidator = [
  param("id")
    .trim()
    .isUUID()
    .withMessage("Invalid review ID format."),

  body("status")
    .notEmpty()
    .withMessage("Status is required.")
    .isIn(REVIEW_STATUSES)
    .withMessage(`Status must be one of: ${REVIEW_STATUSES.join(", ")}`),
];
