import { body, param, query } from "express-validator";

export const trackVisitValidator = [
  body("productId")
    .optional()
    .isUUID()
    .withMessage("Product ID in body must be a valid UUID"),
];

export const productIdParamValidator = [
  param("productId")
    .notEmpty()
    .withMessage("Product ID parameter is required")
    .isUUID()
    .withMessage("Product ID parameter must be a valid UUID"),
];

export const idParamValidator = [
  param("id")
    .notEmpty()
    .withMessage("Product ID parameter is required")
    .isUUID()
    .withMessage("Product ID parameter must be a valid UUID"),
];

export const visitQueryValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
];

export const adminVisitsQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("isHighlyInterested")
    .optional()
    .isIn(["all", "true", "false"])
    .withMessage("isHighlyInterested must be one of: all, true, false"),
  query("sortBy")
    .optional()
    .isIn(["latestVisit", "firstVisit", "visitCount", "userName", "productName"])
    .withMessage("Invalid sortBy field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
  query("categoryId")
    .optional()
    .isUUID()
    .withMessage("categoryId must be a valid UUID"),
  query("userId")
    .optional()
    .isUUID()
    .withMessage("userId must be a valid UUID"),
  query("productId")
    .optional()
    .isUUID()
    .withMessage("productId must be a valid UUID"),
];

export const adminRankedQueryValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("Limit must be between 1 and 200"),
  query("sortBy")
    .optional()
    .isIn(["totalVisits", "uniqueVisitors", "highlyInterestedCount", "latestVisit", "name", "price"])
    .withMessage("Invalid sortBy field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
  query("categoryId")
    .optional()
    .isUUID()
    .withMessage("categoryId must be a valid UUID"),
];
