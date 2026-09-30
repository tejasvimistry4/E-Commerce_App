import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  registerVendor,
  loginUser,
  googleAuthService,
  getUserById,
  getAllUsers,
  getAllVendors,
  updateVendorStatus,
  getVendorDashboardData,
} from "./auth.service";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await registerUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const registerVendorController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await registerVendor({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      businessName: req.body.businessName,
      businessPhone: req.body.businessPhone,
      businessAddress: req.body.businessAddress,
      businessDescription: req.body.businessDescription,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await loginUser({
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await googleAuthService(req.body.idToken);

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await getUserById(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUPER ADMIN VENDOR MANAGEMENT CONTROLLERS
// ==========================================

export const getVendors = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, search, page, limit, sortBy, sortOrder } = req.query;
    const result = await getAllVendors({
      status: status as string,
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    });

    return res.status(200).json({
      success: true,
      message: "Vendors retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendorId = req.params.id as string;
    const vendor = await getUserById(vendorId);

    return res.status(200).json({
      success: true,
      message: "Vendor retrieved successfully",
      data: {
        vendor,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVendorStatusController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendorId = req.params.id as string;
    const { status, adminFeedback } = req.body;

    const updated = await updateVendorStatus(vendorId, status, adminFeedback);

    return res.status(200).json({
      success: true,
      message: `Vendor status successfully updated to ${status}`,
      data: {
        vendor: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// VENDOR PORTAL DASHBOARD CONTROLLER
// ==========================================

export const getVendorStatsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // If SUPER_ADMIN passes a vendorId query, allow them to view that vendor's dashboard
    let targetVendorId = req.user.id;
    if (req.user.role === "SUPER_ADMIN" && req.query.vendorId) {
      targetVendorId = req.query.vendorId as string;
    }

    const stats = await getVendorDashboardData(targetVendorId);

    return res.status(200).json({
      success: true,
      message: "Vendor dashboard data retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};