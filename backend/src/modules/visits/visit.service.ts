import { prisma } from "../../config/prisma";
import {
  TrackVisitResponse,
  ProductVisitStatusResponse,
  HighlyInterestedListResponse,
  RecentVisitsListResponse,
  HighlyInterestedProductItem,
  AdminVisitsListResponse,
  AdminVisitsFilterParams,
  AdminRankedProductsResponse,
  AdminProductVisitItem,
  AdminRankedProductItem,
} from "./visit.types";

export class VisitService {
  /**
   * Number of genuine visits required to flag a product as Highly Interested
   */
  public readonly HIGH_INTEREST_THRESHOLD = 3;

  /**
   * Cooldown window in milliseconds between genuine visits to prevent duplicate/refresh spam
   * Default: 15 minutes (900,000 ms)
   */
  public readonly VISIT_COOLDOWN_MS = 15 * 60 * 1000;

  /**
   * Helper: Format a raw database ProductVisit record with product & variant details
   */
  private formatVisitItem(item: any): HighlyInterestedProductItem {
    const product = item.product;

    return {
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      visitCount: item.visitCount,
      isHighlyInterested: item.isHighlyInterested,
      firstVisitedAt: item.firstVisitedAt,
      lastVisitedAt: item.lastVisitedAt,
      visitTimestamps: item.visitTimestamps || [],
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        sku: product.sku,
        images: product.images || [],
        thumbnail: product.thumbnail || product.images?.[0] || null,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        categoryId: product.categoryId,
        category: product.category
          ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
          : undefined,
        variants: product.variants
          ? product.variants.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            comparePrice: v.comparePrice,
            stock: v.stock,
            images: v.images || [],
            thumbnail: v.thumbnail || v.images?.[0] || null,
            attributes: (v.attributes as Record<string, string>) || {},
            isActive: v.isActive,
          }))
          : [],
      },
    };
  }

  /**
   * 1. Track a product visit for an authenticated user with anti-spam / debounce protection
   */
  async trackProductVisit(
    userId: string,
    productId: string
  ): Promise<TrackVisitResponse> {
    // Verify product existence
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, isActive: true },
    });
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }
    
    if (!product.isActive) {
      throw new Error(`Product "${product.name}" is currently inactive.`);
    }

    const now = new Date();

    // Look up existing visit record for (userId, productId)
    const existing = await prisma.productVisit.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    // Case A: First time visit for this user and product
    if (!existing) {
      const isHighlyInterested = 1 >= this.HIGH_INTEREST_THRESHOLD; // false (1 < 3)

      const created = await prisma.productVisit.create({
        data: {
          userId,
          productId,
          visitCount: 1,
          isHighlyInterested,
          firstVisitedAt: now,
          lastVisitedAt: now,
          visitTimestamps: [now],
        },
      });

      return {
        success: true,
        message: `First visit recorded for "${product.name}".`,
        isGenuineVisit: true,
        visitCount: created.visitCount,
        isHighlyInterested: created.isHighlyInterested,
        firstVisitedAt: created.firstVisitedAt,
        lastVisitedAt: created.lastVisitedAt,
        threshold: this.HIGH_INTEREST_THRESHOLD,
      };
    }

    // Case B: Existing visit record found - Check cooldown against lastVisitedAt
    const lastVisitedMs = new Date(existing.lastVisitedAt).getTime();
    const elapsedMs = now.getTime() - lastVisitedMs;

    // Sub-case B.1: Within cooldown window (rapid refresh / duplicate view)
    if (elapsedMs < this.VISIT_COOLDOWN_MS) {
      const cooldownRemainingSeconds = Math.ceil(
        (this.VISIT_COOLDOWN_MS - elapsedMs) / 1000
      );

      return {
        success: true,
        message: `Duplicate visit detected within cooldown window (${cooldownRemainingSeconds}s remaining). Visit count unchanged.`,
        isGenuineVisit: false,
        visitCount: existing.visitCount,
        isHighlyInterested: existing.isHighlyInterested,
        firstVisitedAt: existing.firstVisitedAt,
        lastVisitedAt: existing.lastVisitedAt,
        cooldownRemainingSeconds,
        threshold: this.HIGH_INTEREST_THRESHOLD,
      };
    }

    // Sub-case B.2: Beyond cooldown window (genuine repeat visit)
    const newVisitCount = existing.visitCount + 1;
    const newIsHighlyInterested =
      existing.isHighlyInterested ||
      newVisitCount >= this.HIGH_INTEREST_THRESHOLD;

    const updated = await prisma.productVisit.update({
      where: { id: existing.id },
      data: {
        visitCount: newVisitCount,
        isHighlyInterested: newIsHighlyInterested,
        lastVisitedAt: now,
        visitTimestamps: {
          push: now,
        },
      },
    });

    const statusChanged =
      newIsHighlyInterested && !existing.isHighlyInterested;

    return {
      success: true,
      message: statusChanged
        ? `High interest reached! "${product.name}" has been marked as Highly Interested for you.`
        : `Genuine visit recorded for "${product.name}" (${newVisitCount} total visits).`,
      isGenuineVisit: true,
      visitCount: updated.visitCount,
      isHighlyInterested: updated.isHighlyInterested,
      firstVisitedAt: updated.firstVisitedAt,
      lastVisitedAt: updated.lastVisitedAt,
      threshold: this.HIGH_INTEREST_THRESHOLD,
    };
  }

  /**
   * 2. Get visit status for a specific product and user
   */
  async getProductVisitStatus(
    userId: string,
    productId: string
  ): Promise<ProductVisitStatusResponse> {
    const visit = await prisma.productVisit.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!visit) {
      return {
        success: true,
        hasVisited: false,
        visitCount: 0,
        isHighlyInterested: false,
        firstVisitedAt: null,
        lastVisitedAt: null,
        threshold: this.HIGH_INTEREST_THRESHOLD,
      };
    }

    return {
      success: true,
      hasVisited: true,
      visitCount: visit.visitCount,
      isHighlyInterested: visit.isHighlyInterested,
      firstVisitedAt: visit.firstVisitedAt,
      lastVisitedAt: visit.lastVisitedAt,
      threshold: this.HIGH_INTEREST_THRESHOLD,
    };
  }

  /**
   * 3. Get all products marked as Highly Interested for an authenticated user
   */
  async getHighlyInterestedProducts(
    userId: string,
    limit: number = 50
  ): Promise<HighlyInterestedListResponse> {
    const rawVisits = await prisma.productVisit.findMany({
      where: {
        userId,
        isHighlyInterested: true,
        product: {
          isActive: true,
        },
      },
      orderBy: {
        lastVisitedAt: "desc",
      },
      take: Math.min(Math.max(limit, 1), 100),
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            variants: {
              where: { isActive: true },
              orderBy: { price: "asc" },
            },
          },
        },
      },
    });

    const items = rawVisits.map((item) => this.formatVisitItem(item));

    return {
      success: true,
      totalItems: items.length,
      items,
    };
  }

  /**
   * 4. Get recent visits for customer dashboard / history
   */
  async getUserRecentVisits(
    userId: string,
    limit: number = 12
  ): Promise<RecentVisitsListResponse> {
    const rawVisits = await prisma.productVisit.findMany({
      where: {
        userId,
        product: {
          isActive: true,
        },
      },
      orderBy: {
        lastVisitedAt: "desc",
      },
      take: Math.min(Math.max(limit, 1), 50),
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            variants: {
              where: { isActive: true },
              orderBy: { price: "asc" },
            },
          },
        },
      },
    });

    const items = rawVisits.map((item) => this.formatVisitItem(item));

    return {
      success: true,
      totalItems: items.length,
      items,
    };
  }

  // ==========================================
  // SUPER_ADMIN DASHBOARD SERVICES
  // ==========================================

  /**
   * 5. SUPER_ADMIN / VENDOR: Get all user-by-product visit records with search, filter, sorting, pagination & statistics
   */
  async getAdminVisits(
    params: AdminVisitsFilterParams = {},
    caller?: { id: string; role: string }
  ): Promise<AdminVisitsListResponse> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Scope to vendor products if caller is VENDOR
    if (caller?.role === "VENDOR") {
      where.product = {
        ...where.product,
        vendorId: caller.id,
      };
    }

    // Filter by Highly Interested
    if (params.isHighlyInterested === "true") {
      where.isHighlyInterested = true;
    } else if (params.isHighlyInterested === "false") {
      where.isHighlyInterested = false;
    }

    // Filter by User ID
    if (params.userId) {
      where.userId = params.userId;
    }

    // Filter by Product ID
    if (params.productId) {
      where.productId = params.productId;
    }

    // Filter by Category
    if (params.categoryId) {
      where.product = {
        ...where.product,
        categoryId: params.categoryId,
      };
    }

    // Search query (User Name, User Email, Product Name, SKU)
    if (params.search && params.search.trim()) {
      const search = params.search.trim();
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { sku: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Determine Sort order
    const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";
    let orderBy: any = { lastVisitedAt: "desc" };

    switch (params.sortBy) {
      case "firstVisit":
        orderBy = { firstVisitedAt: sortOrder };
        break;
      case "visitCount":
        orderBy = { visitCount: sortOrder };
        break;
      case "userName":
        orderBy = { user: { name: sortOrder } };
        break;
      case "productName":
        orderBy = { product: { name: sortOrder } };
        break;
      case "latestVisit":
      default:
        orderBy = { lastVisitedAt: sortOrder };
        break;
    }

    // Query data and count concurrently
    const [rawItems, total, allStats, uniqueShoppersCount, uniqueProductsCount, highlyInterestedCount] =
      await Promise.all([
        prisma.productVisit.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                comparePrice: true,
                stock: true,
                sku: true,
                thumbnail: true,
                isActive: true,
                categoryId: true,
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        }),
        prisma.productVisit.count({ where }),
        prisma.productVisit.aggregate({
          where,
          _sum: { visitCount: true },
          _count: { id: true },
        }),
        prisma.productVisit.groupBy({
          by: ["userId"],
          where,
          _count: { id: true },
        }),
        prisma.productVisit.groupBy({
          by: ["productId"],
          where,
          _count: { id: true },
        }),
        prisma.productVisit.count({
          where: { ...where, isHighlyInterested: true },
        }),
      ]);

    const totalVisitsCount = allStats._sum.visitCount || 0;
    const totalPairs = allStats._count.id || 0;
    const conversionRatePercent =
      totalPairs > 0
        ? Math.round((highlyInterestedCount / totalPairs) * 1000) / 10
        : 0;

    const items: AdminProductVisitItem[] = rawItems.map((item) => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      visitCount: item.visitCount,
      isHighlyInterested: item.isHighlyInterested,
      firstVisitedAt: item.firstVisitedAt,
      lastVisitedAt: item.lastVisitedAt,
      visitTimestamps: item.visitTimestamps || [item.firstVisitedAt],
      createdAt: item.createdAt,
      user: item.user,
      product: item.product,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalVisitsCount,
        totalUniqueUserProductPairs: totalPairs,
        totalHighlyInterestedPairs: highlyInterestedCount,
        conversionRatePercent,
        totalUniqueShoppers: uniqueShoppersCount.length,
        totalProductsTracked: uniqueProductsCount.length,
      },
    };
  }

  /**
   * 6. SUPER_ADMIN / VENDOR Report: Products Ranked by Highest Total Visits Overall
   */
  async getAdminRankedProducts(
    params: {
      search?: string;
      categoryId?: string;
      sortBy?: "totalVisits" | "uniqueVisitors" | "highlyInterestedCount" | "latestVisit" | "name" | "price";
      sortOrder?: "asc" | "desc";
      limit?: number;
    } = {},
    caller?: { id: string; role: string }
  ): Promise<AdminRankedProductsResponse> {
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

    const where: any = {};
    if (caller?.role === "VENDOR") {
      where.product = {
        ...where.product,
        vendorId: caller.id,
      };
    }
    if (params.categoryId) {
      where.product = {
        ...where.product,
        categoryId: params.categoryId,
      };
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      where.product = {
        ...where.product,
        OR: [
          { name: { contains: s, mode: "insensitive" } },
          { sku: { contains: s, mode: "insensitive" } },
        ],
      };
    }

    // Fetch all visits with product details
    const allVisits = await prisma.productVisit.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            stock: true,
            sku: true,
            thumbnail: true,
            isActive: true,
            categoryId: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    // Aggregate by Product ID
    const productMap = new Map<string, AdminRankedProductItem>();

    for (const v of allVisits) {
      if (!v.product) continue;

      const existing = productMap.get(v.productId);
      if (!existing) {
        productMap.set(v.productId, {
          productId: v.productId,
          name: v.product.name,
          slug: v.product.slug,
          sku: v.product.sku,
          price: v.product.price,
          comparePrice: v.product.comparePrice,
          stock: v.product.stock,
          thumbnail: v.product.thumbnail,
          isActive: v.product.isActive,
          categoryId: v.product.categoryId,
          category: v.product.category,
          totalVisitsCount: v.visitCount,
          uniqueVisitorsCount: 1,
          highlyInterestedUsersCount: v.isHighlyInterested ? 1 : 0,
          conversionRatePercent: v.isHighlyInterested ? 100 : 0,
          latestVisitAt: v.lastVisitedAt,
          firstVisitAt: v.firstVisitedAt,
        });
      } else {
        existing.totalVisitsCount += v.visitCount;
        existing.uniqueVisitorsCount += 1;
        if (v.isHighlyInterested) {
          existing.highlyInterestedUsersCount += 1;
        }
        if (new Date(v.lastVisitedAt) > new Date(existing.latestVisitAt)) {
          existing.latestVisitAt = v.lastVisitedAt;
        }
        if (new Date(v.firstVisitedAt) < new Date(existing.firstVisitAt)) {
          existing.firstVisitAt = v.firstVisitedAt;
        }
        existing.conversionRatePercent =
          existing.uniqueVisitorsCount > 0
            ? Math.round(
              (existing.highlyInterestedUsersCount /
                existing.uniqueVisitorsCount) *
              1000
            ) / 10
            : 0;
      }
    }

    let rankedList = Array.from(productMap.values());

    // Sort ranked list
    rankedList.sort((a, b) => {
      let comparison = 0;
      switch (params.sortBy) {
        case "uniqueVisitors":
          comparison = a.uniqueVisitorsCount - b.uniqueVisitorsCount;
          break;
        case "highlyInterestedCount":
          comparison = a.highlyInterestedUsersCount - b.highlyInterestedUsersCount;
          break;
        case "latestVisit":
          comparison =
            new Date(a.latestVisitAt).getTime() -
            new Date(b.latestVisitAt).getTime();
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "totalVisits":
        default:
          comparison = a.totalVisitsCount - b.totalVisitsCount;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const overallVisits = rankedList.reduce(
      (acc, curr) => acc + curr.totalVisitsCount,
      0
    );
    const overallHighlyInterested = rankedList.reduce(
      (acc, curr) => acc + curr.highlyInterestedUsersCount,
      0
    );
    const topProduct =
      rankedList.length > 0
        ? { name: rankedList[0].name, visits: rankedList[0].totalVisitsCount }
        : null;

    return {
      success: true,
      totalProducts: rankedList.length,
      items: rankedList.slice(0, limit),
      stats: {
        overallVisits,
        overallHighlyInterested,
        topProduct,
      },
    };
  }
}

export default new VisitService();
