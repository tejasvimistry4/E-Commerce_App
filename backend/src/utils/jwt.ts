import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

export interface UserJwtPayload extends DefaultJwtPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (payload: {
  id: string;
  email: string;
  role: string;
}): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string): UserJwtPayload => {
  return jwt.verify(token, env.jwtSecret) as UserJwtPayload;
};
