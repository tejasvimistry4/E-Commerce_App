export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  HEADERS: {
    JSON: "application/json",
    MULTIPART: "multipart/form-data",
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
