import { REGEX } from "../constants/regex";
import { LoginPayload, RegisterPayload } from "../types/auth";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateLogin = (data: LoginPayload): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.email || !data.email.trim()) {
    errors.email = "Email address is required";
  } else if (!REGEX.EMAIL.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.password) {
    errors.password = "Password is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRegister = (
  data: RegisterPayload & { confirmPassword?: string }
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Full name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email address is required";
  } else if (!REGEX.EMAIL.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  }

  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
