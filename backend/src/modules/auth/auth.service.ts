import { prisma } from "../../config/prisma";
import { Role, VendorStatus, OrderStatus } from "@prisma/client";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import { verifyGoogleIdToken } from "../../utils/googleAuth";
import {
  RegisterInput,
  VendorRegisterInput,
  LoginInput,
  AuthResponseData,
  AuthUser,
  VendorFilterQuery,
  VendorStatusType,
  VendorDashboardStats,
} from "./auth.types";
import { CustomError } from "../../middleware/error.middleware";

export const registerUser = async (
  data: RegisterInput
): Promise<AuthResponseData> => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email.toLowerCase().trim(),
    },
  });

  if (existingUser) {
    const error: CustomError = new Error(
      "An account with this email already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      role: Role.USER,
      vendorStatus: VendorStatus.APPROVED,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendorStatus: true,
      isActive: true,
      avatar: true,
      googleId: true,
      createdAt: true,
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      ...user,
      role: user.role as any,
      vendorStatus: user.vendorStatus as any,
    },
    token,
  };
};

export const registerVendor = async (
  data: VendorRegisterInput
): Promise<{ user: AuthUser; message: string }> => {
  const email = data.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error: CustomError = new Error(
      "An account with this email already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      password: hashedPassword,
      role: Role.VENDOR,
      vendorStatus: VendorStatus.PENDING,
      isActive: false,
      businessName: data.businessName.trim(),
      businessPhone: data.businessPhone?.trim() || null,
      businessAddress: data.businessAddress?.trim() || null,
      businessDescription: data.businessDescription?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendorStatus: true,
      isActive: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
      businessDescription: true,
      approvedAt: true,
      rejectedAt: true,
      adminFeedback: true,
      createdAt: true,
    },
  });

  return {
    user: {
      ...user,
      role: user.role as any,
      vendorStatus: user.vendorStatus as any,
    },
    message:
      "Vendor registration submitted successfully! Your account is pending Super Admin review and approval.",
  };
};

export const loginUser = async (
  data: LoginInput
): Promise<AuthResponseData> => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email.toLowerCase().trim(),
    },
  });

  if (!user) {
    const error: CustomError = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Account registered solely with Google OAuth
  if (!user.password) {
    const error: CustomError = new Error(
      "This account was registered using Google Sign-In. Please sign in with Google."
    );
    error.statusCode = 400;
    throw error;
  }

  const isPasswordValid = await comparePassword(
    data.password,
    user.password
  );

  if (!isPasswordValid) {
    const error: CustomError = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // If role is VENDOR, enforce approval and active status checks
  if (user.role === Role.VENDOR) {
    if (user.vendorStatus === VendorStatus.PENDING || !user.isActive) {
      if (user.vendorStatus === VendorStatus.REJECTED) {
        const error: CustomError = new Error(
          `Your vendor account application was rejected. ${
            user.adminFeedback ? `Reason: ${user.adminFeedback}` : "Please contact Super Admin."
          }`
        );
        error.statusCode = 403;
        throw error;
      }

      if (user.vendorStatus === VendorStatus.INACTIVE) {
        const error: CustomError = new Error(
          "Your vendor account has been deactivated. Please contact Super Admin."
        );
        error.statusCode = 403;
        throw error;
      }

      const error: CustomError = new Error(
        "Your vendor account is pending approval by Super Admin. You will be able to log in once approved."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const userProfile: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as any,
    vendorStatus: user.vendorStatus as any,
    isActive: user.isActive,
    businessName: user.businessName,
    businessPhone: user.businessPhone,
    businessAddress: user.businessAddress,
    businessDescription: user.businessDescription,
    approvedAt: user.approvedAt,
    rejectedAt: user.rejectedAt,
    adminFeedback: user.adminFeedback,
    avatar: user.avatar,
    googleId: user.googleId,
    createdAt: user.createdAt,
  };

  return {
    user: userProfile,
    token,
  };
};

export const googleAuthService = async (
  idToken: string
): Promise<AuthResponseData> => {
  const googlePayload = await verifyGoogleIdToken(idToken);
  const { googleId, email, name, avatar } = googlePayload;

  // Check if user already exists with this Google ID or Email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId },
        { email },
      ],
    },
  });

  if (user) {
    // Perform account linking if googleId or avatar was not linked
    const updateData: { googleId?: string; avatar?: string; name?: string } = {};
    if (!user.googleId) {
      updateData.googleId = googleId;
    }
    if (!user.avatar && avatar) {
      updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }
  } else {
    // Create a new user account with verified Google identity (Always USER role)
    user = await prisma.user.create({
      data: {
        name,
        email,
        googleId,
        avatar,
        password: null,
        role: Role.USER,
        vendorStatus: VendorStatus.APPROVED,
        isActive: true,
      },
    });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as any,
    vendorStatus: user.vendorStatus as any,
    isActive: user.isActive,
    businessName: user.businessName,
    avatar: user.avatar,
    googleId: user.googleId,
    createdAt: user.createdAt,
  };

  return {
    user: authUser,
    token,
  };
};

export const getUserById = async (id: string): Promise<AuthUser> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendorStatus: true,
      isActive: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
      businessDescription: true,
      approvedAt: true,
      rejectedAt: true,
      adminFeedback: true,
      avatar: true,
      googleId: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error: CustomError = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    ...user,
    role: user.role as any,
    vendorStatus: user.vendorStatus as any,
  };
};

export const getAllUsers = async (): Promise<AuthUser[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendorStatus: true,
      isActive: true,
      businessName: true,
      businessPhone: true,
      avatar: true,
      googleId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map((u) => ({
    ...u,
    role: u.role as any,
    vendorStatus: u.vendorStatus as any,
  }));
};

// ==========================================
// SUPER ADMIN VENDOR MANAGEMENT SERVICES
// ==========================================

export const getAllVendors = async (query: VendorFilterQuery = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {
    role: Role.VENDOR,
  };

  if (query.status && query.status !== "ALL") {
    where.vendorStatus = query.status as VendorStatus;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { businessName: { contains: term, mode: "insensitive" } },
      { businessPhone: { contains: term, mode: "insensitive" } },
    ];
  }

  const [rawVendors, total, totalCount, pendingCount, approvedCount, rejectedCount, inactiveCount] =
    await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          vendorStatus: true,
          isActive: true,
          businessName: true,
          businessPhone: true,
          businessAddress: true,
          businessDescription: true,
          approvedAt: true,
          rejectedAt: true,
          adminFeedback: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              vendorProducts: true,
              vendorCategories: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: Role.VENDOR } }),
      prisma.user.count({ where: { role: Role.VENDOR, vendorStatus: VendorStatus.PENDING } }),
      prisma.user.count({ where: { role: Role.VENDOR, vendorStatus: VendorStatus.APPROVED } }),
      prisma.user.count({ where: { role: Role.VENDOR, vendorStatus: VendorStatus.REJECTED } }),
      prisma.user.count({ where: { role: Role.VENDOR, vendorStatus: VendorStatus.INACTIVE } }),
    ]);

  // Compute live metrics for each vendor
  const vendors = await Promise.all(
    rawVendors.map(async (v) => {
      // Find orders that contain products belonging to this vendor
      const orderItems = await prisma.orderItem.findMany({
        where: {
          product: {
            vendorId: v.id,
          },
        },
        select: {
          totalPrice: true,
          orderId: true,
        },
      });

      const totalRevenue = orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const uniqueOrderIds = new Set(orderItems.map((item) => item.orderId));

      const reviews = await prisma.review.findMany({
        where: {
          product: {
            vendorId: v.id,
          },
        },
        select: { rating: true },
      });

      const avgRating =
        reviews.length > 0
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
          : 0;

      const visitsCount = await prisma.productVisit.aggregate({
        where: {
          product: {
            vendorId: v.id,
          },
        },
        _sum: { visitCount: true },
      });

      const activeProductCount = await prisma.product.count({
        where: {
          vendorId: v.id,
          isActive: true,
        },
      });

      const totalProductsCount = v._count?.vendorProducts ?? 0;
      const formattedRevenue = Math.round(totalRevenue * 100) / 100;

      return {
        ...v,
        role: v.role as any,
        vendorStatus: v.vendorStatus as any,
        productCount: totalProductsCount,
        activeProductCount,
        orderCount: uniqueOrderIds.size,
        totalRevenue: formattedRevenue,
        metrics: {
          productsCount: totalProductsCount,
          activeProductsCount: activeProductCount,
          categoriesCount: v._count?.vendorCategories ?? 0,
          ordersCount: uniqueOrderIds.size,
          totalRevenue: formattedRevenue,
          averageRating: avgRating,
          totalVisits: visitsCount._sum.visitCount || 0,
        },
      };
    })
  );

  return {
    vendors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    counts: {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      inactive: inactiveCount,
    },
  };
};

export const updateVendorStatus = async (
  vendorId: string,
  targetStatus: VendorStatusType,
  adminFeedback?: string
) => {
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
  });

  if (!vendor || vendor.role !== Role.VENDOR) {
    const error: CustomError = new Error("Vendor account not found");
    error.statusCode = 404;
    throw error;
  }

  const updateData: any = {
    vendorStatus: targetStatus as VendorStatus,
  };

  if (targetStatus === "APPROVED") {
    updateData.isActive = true;
    updateData.approvedAt = new Date();
    updateData.rejectedAt = null;
    updateData.adminFeedback = adminFeedback || null;
  } else if (targetStatus === "REJECTED") {
    updateData.isActive = false;
    updateData.rejectedAt = new Date();
    updateData.adminFeedback = adminFeedback || "Application does not meet requirements.";
  } else if (targetStatus === "INACTIVE") {
    updateData.isActive = false;
    if (adminFeedback) {
      updateData.adminFeedback = adminFeedback;
    }
  }

  const updated = await prisma.user.update({
    where: { id: vendorId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendorStatus: true,
      isActive: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
      businessDescription: true,
      approvedAt: true,
      rejectedAt: true,
      adminFeedback: true,
      updatedAt: true,
    },
  });

  return {
    ...updated,
    role: updated.role as any,
    vendorStatus: updated.vendorStatus as any,
  };
};

// ==========================================
// VENDOR DASHBOARD & ANALYTICS SERVICE
// ==========================================

export const getVendorDashboardData = async (vendorId: string): Promise<VendorDashboardStats> => {
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      vendorStatus: true,
      isActive: true,
      approvedAt: true,
    },
  });

  if (!vendor) {
    const error: CustomError = new Error("Vendor account not found");
    error.statusCode = 404;
    throw error;
  }

  // 1. Total Products, Active, Out of Stock, Low Stock & Top Products
  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockProducts,
    topProducts,
    totalCategories,
  ] = await Promise.all([
    prisma.product.count({
      where: { vendorId },
    }),
    prisma.product.count({
      where: { vendorId, isActive: true },
    }),
    prisma.product.count({
      where: { vendorId, stock: 0 },
    }),
    prisma.product.findMany({
      where: {
        vendorId,
        stock: { lte: 5 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        thumbnail: true,
        isActive: true,
      },
      take: 5,
      orderBy: { stock: "asc" },
    }),
    prisma.product.findMany({
      where: { vendorId },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        thumbnail: true,
        isActive: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.count({
      where: {
        OR: [
          { vendorId },
          { products: { some: { vendorId } } },
        ],
      },
    }),
  ]);

  // 2. Orders & Revenue containing vendor products
  const orderItems = await prisma.orderItem.findMany({
    where: {
      product: {
        vendorId,
      },
      order: {
        status: { not: OrderStatus.CANCELLED },
      },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = Math.round(
    orderItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0) * 100
  ) / 100;

  const uniqueOrdersMap = new Map<string, any>();
  orderItems.forEach((item) => {
    if (item.order && !uniqueOrdersMap.has(item.order.id)) {
      uniqueOrdersMap.set(item.order.id, {
        ...item.order,
        itemCount: 1,
        vendorTotal: item.totalPrice,
      });
    } else if (item.order) {
      const existing = uniqueOrdersMap.get(item.order.id);
      existing.itemCount += 1;
      existing.vendorTotal += item.totalPrice;
    }
  });

  const recentOrders = Array.from(uniqueOrdersMap.values()).slice(0, 5);

  // 3. Reviews & Ratings
  const reviews = await prisma.review.findMany({
    where: {
      product: {
        vendorId,
      },
    },
    select: { rating: true },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

  // 4. Product Visits & Leads
  const [visitsAgg, highlyInterestedLeadsCount] = await Promise.all([
    prisma.productVisit.aggregate({
      where: {
        product: {
          vendorId,
        },
      },
      _sum: { visitCount: true },
    }),
    prisma.productVisit.count({
      where: {
        product: {
          vendorId,
        },
        isHighlyInterested: true,
      },
    }),
  ]);

  // 5. 7-Day Sales Trend
  const salesTrendMap: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    salesTrendMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
  }

  orderItems.forEach((item) => {
    if (item.createdAt) {
      const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (salesTrendMap[dateStr]) {
        salesTrendMap[dateStr].revenue += item.totalPrice || 0;
        salesTrendMap[dateStr].orders += 1;
      }
    }
  });

  return {
    vendor: {
      ...vendor,
      vendorStatus: vendor.vendorStatus as any,
    },
    metrics: {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalOrders: uniqueOrdersMap.size,
      totalRevenue,
      totalCategories,
      totalReviews,
      averageRating,
      totalVisits: visitsAgg._sum.visitCount || 0,
      highlyInterestedLeads: highlyInterestedLeadsCount,
    },
    kpis: {
      totalRevenue,
      totalOrders: uniqueOrdersMap.size,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      averageRating,
      totalReviews,
      totalVisits: visitsAgg._sum.visitCount || 0,
      highlyInterestedLeadsCount,
    },
    recentOrders,
    topProducts,
    lowStockProducts,
    salesTrend: Object.values(salesTrendMap),
  };
};