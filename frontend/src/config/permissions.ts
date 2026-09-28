import { ROLES, Role } from "../constants/roles";
import { AuthUser } from "../types/auth";

export const isAdmin = (user: AuthUser | null | undefined): boolean => {
  return Boolean(user && user.role === ROLES.SUPER_ADMIN);
};

export const isUser = (user: AuthUser | null | undefined): boolean => {
  return Boolean(user && user.role === ROLES.USER);
};

export const hasRole = (
  user: AuthUser | null | undefined,
  requiredRole: Role
): boolean => {
  return Boolean(user && user.role === requiredRole);
};
