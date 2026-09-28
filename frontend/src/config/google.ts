export const GOOGLE_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
  isConfigured: Boolean(
    process.env.REACT_APP_GOOGLE_CLIENT_ID &&
      process.env.REACT_APP_GOOGLE_CLIENT_ID.trim().length > 0
  ),
};
