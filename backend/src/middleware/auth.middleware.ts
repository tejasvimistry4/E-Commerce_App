import { Request, Response, NextFunction } from "express";
import { verifyToken, UserJwtPayload } from "../utils/jwt";
import { prisma } from "../config/prisma";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    vendorStatus?: string | null;
    isActive?: boolean;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Bearer token required.",
      });
    }

    let decoded: UserJwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        vendorStatus: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists.",
      });
    }

    // If account is deactivated or vendor is not approved, block requests
    if (!user.isActive || (user.role === "VENDOR" && user.vendorStatus !== "APPROVED")) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive or pending Super Admin approval.",
      });
    }

    req.user = {
      ...user,
      vendorStatus: user.vendorStatus || undefined,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have permission.`,
      });
    }

    next();
  };
};
