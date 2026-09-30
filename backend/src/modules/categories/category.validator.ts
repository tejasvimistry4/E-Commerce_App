import { body, param, query } from "express-validator";

export const createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be URL-safe lowercase alphanumeric words separated by hyphens"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("image")
    .optional({ nullable: true })
    .trim(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  body("parentId")
    .optional({ nullable: true })
    .trim(),
];

export const updateCategoryValidator = [
  param("id")
    .notEmpty()
    .withMessage("Category ID is required in URL parameter"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be URL-safe lowercase alphanumeric words separated by hyphens"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("image")
    .optional({ nullable: true })
    .trim(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  body("parentId")
    .optional({ nullable: true })
    .trim(),
];

export const categoryIdParamValidator = [
  param("id")
    .notEmpty()
    .withMessage("Category ID is required"),
];

export const categorySlugParamValidator = [
  param("slug")
    .notEmpty()
    .withMessage("Category slug is required"),
];
