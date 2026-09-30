import { CreateCategoryPayload } from "../types/category";
import { ValidationResult } from "./auth.schema";

export const validateCategory = (data: Partial<CreateCategoryPayload>): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Category name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Category name must be at least 2 characters long";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
