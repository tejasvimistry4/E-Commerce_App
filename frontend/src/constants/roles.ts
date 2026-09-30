export const ROLES = {
  USER: "USER",
  SUPER_ADMIN: "SUPER_ADMIN",
  VENDOR: "VENDOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
