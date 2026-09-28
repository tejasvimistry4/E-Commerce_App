import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { CustomError } from "../middleware/error.middleware";

export interface GoogleUserPayload {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}

const client = new OAuth2Client(env.googleClientId || undefined);

/**
 * Verify Google ID Token (Credential) and extract verified profile details.
 */
export const verifyGoogleIdToken = async (
  idToken: string
): Promise<GoogleUserPayload> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientId || undefined,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      const error: CustomError = new Error("Invalid Google token payload");
      error.statusCode = 401;
      throw error;
    }

    if (!payload.email_verified) {
      const error: CustomError = new Error(
        "Google account email is not verified. Please verify your Google email."
      );
      error.statusCode = 401;
      throw error;
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.email.split("@")[0] || "User",
      avatar: payload.picture || null,
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    const error: CustomError = new Error(
      err.message || "Google authentication failed. Invalid or expired token."
    );
    error.statusCode = 401;
    throw error;
  }
};
