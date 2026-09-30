export const ENV = {
  API_BASE_URL:
    (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
    "http://localhost:5000/api",
  IMAGE_BASE_URL:
    (typeof process !== "undefined" && process.env?.REACT_APP_IMAGE_URL) ||
    "http://localhost:5000",
  NODE_ENV:
    (typeof process !== "undefined" && process.env?.NODE_ENV) || "development",
  IS_DEV:
    (typeof process !== "undefined" && process.env?.NODE_ENV) !== "production",
} as const;
