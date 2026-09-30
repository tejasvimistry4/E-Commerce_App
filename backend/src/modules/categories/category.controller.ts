import { Request, Response, NextFunction } from "express";
import * as categoryService from "./category.service";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

// GET /api/categories (Public user endpoint - active categories only)
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await categoryService.getAllCategories(req.query, false);
    return res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      count: categories.length,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/admin/all (Admin & Vendor endpoint)
export const getAdminCategories = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const categories = await categoryService.getAllCategories(req.query, true, caller);
    return res.status(200).json({
      success: true,
      message: "All categories retrieved successfully",
      count: categories.length,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/tree (Public category tree)
export const getCategoryTree = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const onlyActive = req.query.all !== "true";
    const tree = await categoryService.getCategoryTree(onlyActive);
    return res.status(200).json({
      success: true,
      message: "Category hierarchy tree retrieved successfully",
      data: {
        categories: tree,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/slug/:slug
export const getCategoryBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug as string, false);
    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id as string, false);
    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories (Super Admin or Vendor)
export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendorId = req.user?.role === "VENDOR" ? req.user.id : req.body.vendorId || null;
    const category = await categoryService.createCategory(req.body, vendorId);
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id (Super Admin or Vendor)
export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const category = await categoryService.updateCategory(
      req.params.id as string,
      req.body,
      caller
    );
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/categories/:id/status (Super Admin or Vendor)
export const toggleCategoryStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const category = await categoryService.toggleCategoryStatus(
      req.params.id as string,
      caller
    );
    return res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id (Super Admin or Vendor)
export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const result = await categoryService.deleteCategory(req.params.id as string, caller);
    return res.status(200).json({
      success: true,
      message: `Category '${result.name}' deleted successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
