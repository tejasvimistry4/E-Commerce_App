import { prisma } from "../../config/prisma";
import {
  Review,
  CreateReviewDTO,
  UpdateReviewDTO,
  ReviewFilterQuery,
  AdminReviewFilterQuery,
  ReviewStats,
  UserReviewEligibility,
  ReviewStatus,
} from "./review.types";

export class ReviewService {
  /**
   * 1. Get approved reviews & aggregate statistics for a product (Storefront)
   */
  async getProductReviews(productId: string, query: ReviewFilterQuery = {}) {
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = "createdAt",
      sortOrder = "desc",
      hasImages,
    } = query;

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * take;

    // Base filter: must be for this product and approved
    const where: any = {
      productId,
      status: "APPROVED" as ReviewStatus,
    };

    if (rating !== undefined && !isNaN(Number(rating))) {
      where.rating = Number(rating);
    }

    if (hasImages) {
      where.images = { isEmpty: false };
    }

    const orderBy: any = {};
    if (sortBy === "rating" || sortBy === "createdAt") {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Parallel fetch: reviews, total matching filters, and all approved reviews for global product stats
    const [reviews, totalMatching, allApprovedReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        where: {
          productId,
          status: "APPROVED" as ReviewStatus,
        },
        select: {
          rating: true,
        },
      }),
    ]);

    // Calculate aggregated statistics
    const totalAllReviews = allApprovedReviews.length;
    const ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRatingSum = 0;
    let positiveReviewsCount = 0; // 4 or 5 stars

    for (const r of allApprovedReviews) {
      const star = r.rating as 1 | 2 | 3 | 4 | 5;
      if (ratingBreakdown[star] !== undefined) {
        ratingBreakdown[star]++;
      }
      totalRatingSum += r.rating;
      if (r.rating >= 4) {
        positiveReviewsCount++;
      }
    }

    const averageRating =
      totalAllReviews > 0
        ? Math.round((totalRatingSum / totalAllReviews) * 10) / 10
        : 0;

    const recommendedPercentage =
      totalAllReviews > 0
        ? Math.round((positiveReviewsCount / totalAllReviews) * 100)
        : 100;

    const stats: ReviewStats = {
      averageRating,
      totalReviews: totalAllReviews,
      recommendedPercentage,
      ratingBreakdown,
    };

    return {
      reviews,
      stats,
      pagination: {
        total: totalMatching,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(totalMatching / take) || 1,
        hasPrevPage: pageNum > 1,
        hasNextPage: pageNum < Math.ceil(totalMatching / take),
      },
    };
  }

  /**
   * 2. Check if user is eligible to review and retrieve their existing review
   */
  async getUserReviewForProduct(userId: string, productId: string): Promise<UserReviewEligibility> {
    // Check if user has an existing review
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return {
      canReview: true,
      existingReview: (existingReview as any) || null,
    };
  }

  /**
   * 3. Create a review for a product
   */
  async createReview(userId: string, productId: string, data: CreateReviewDTO): Promise<Review> {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    // 2. Check if review already exists
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new Error("You have already reviewed this product. Please update your existing review instead.");
    }

    // 3. Create review
    const review = await prisma.review.create({
      data: {
        rating: Number(data.rating),
        title: data.title?.trim() || null,
        comment: data.comment.trim(),
        images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
        status: "APPROVED",
        userId,
        productId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            price: true,
          },
        },
      },
    });

    return review as any;
  }

  /**
   * 4. Update an existing review
   */
  async updateReview(userId: string, reviewId: string, data: UpdateReviewDTO): Promise<Review> {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new Error(`Review with ID "${reviewId}" not found.`);
    }

    if (existing.userId !== userId) {
      throw new Error("You are not authorized to edit this review.");
    }

    const updateData: any = {};
    if (data.rating !== undefined) updateData.rating = Number(data.rating);
    if (data.title !== undefined) updateData.title = data.title ? data.title.trim() : null;
    if (data.comment !== undefined) updateData.comment = data.comment.trim();
    if (data.images !== undefined) updateData.images = Array.isArray(data.images) ? data.images.filter(Boolean) : [];

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            price: true,
          },
        },
      },
    });

    return updated as any;
  }

  /**
   * 5. Delete review (by Author or Admin)
   */
  async deleteReview(userId: string, reviewId: string, isAdmin = false) {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new Error(`Review with ID "${reviewId}" not found.`);
    }

    if (!isAdmin && existing.userId !== userId) {
      throw new Error("You are not authorized to delete this review.");
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return { id: reviewId, success: true };
  }

  /**
   * 6. Admin: Get all reviews with search, filter, and pagination (Scoped for Vendor or Super Admin)
   */
  async getAllReviewsAdmin(
    query: AdminReviewFilterQuery = {},
    caller?: { id: string; role: string }
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      rating,
      sortBy = "createdAt",
      sortOrder = "desc",
      productId,
      userId,
      topProductsOnly,
    } = query;

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (caller && caller.role === "VENDOR") {
      where.product = {
        vendorId: caller.id,
      };
    }

    if (topProductsOnly) {
      const topGroups = await prisma.review.groupBy({
        by: ["productId"],
        where: caller && caller.role === "VENDOR" ? { product: { vendorId: caller.id } } : undefined,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      });
      const topProductIds = topGroups.map((g) => g.productId);
      if (topProductIds.length > 0) {
        where.productId = { in: topProductIds };
      }
    }

    if (status) {
      where.status = status;
    }

    if (rating !== undefined && !isNaN(Number(rating))) {
      where.rating = Number(rating);
    }

    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions = [
        { title: { contains: term, mode: "insensitive" } },
        { comment: { contains: term, mode: "insensitive" } },
        { user: { name: { contains: term, mode: "insensitive" } } },
        { user: { email: { contains: term, mode: "insensitive" } } },
        { product: { name: { contains: term, mode: "insensitive" } } },
      ];
      if (where.product) {
        where.AND = [
          { product: where.product },
          { OR: searchConditions },
        ];
        delete where.product;
      } else {
        where.OR = searchConditions;
      }
    }

    const orderBy: any = {};
    if (sortBy === "rating" || sortBy === "createdAt") {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnail: true,
              price: true,
              vendorId: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  /**
   * 7. Admin: Update review moderation status
   */
  async updateReviewStatusAdmin(reviewId: string, status: ReviewStatus) {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new Error(`Review with ID "${reviewId}" not found.`);
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * 8. Admin: Get high-level reviews metrics (Scoped for Vendor or Super Admin)
   */
  async getReviewStatsAdmin(caller?: { id: string; role: string }) {
    const where: any = {};
    if (caller && caller.role === "VENDOR") {
      where.product = { vendorId: caller.id };
    }

    const [total, approved, pending, rejected, allReviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.count({ where: { ...where, status: "APPROVED" } }),
      prisma.review.count({ where: { ...where, status: "PENDING" } }),
      prisma.review.count({ where: { ...where, status: "REJECTED" } }),
      prisma.review.findMany({
        where,
        select: {
          rating: true,
        },
      }),
    ]);

    const totalSum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = allReviews.length > 0 ? Math.round((totalSum / allReviews.length) * 10) / 10 : 0;
    const fiveStarCount = allReviews.filter((r) => r.rating === 5).length;
    const fiveStarRatio = allReviews.length > 0 ? Math.round((fiveStarCount / allReviews.length) * 100) : 0;

    return {
      total,
      approved,
      pending,
      rejected,
      averageRating: avgRating,
      fiveStarRatio,
    };
  }

  /**
   * 9. Get top products ranked by total review count in descending order
   */
  async getTopReviewedProducts(limit = 5) {
    const take = Math.min(50, Math.max(1, Number(limit) || 5));
    const grouped = await prisma.review.groupBy({
      by: ["productId"],
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take,
    });

    if (grouped.length === 0) {
      return [];
    }

    const productIds = grouped.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnail: true,
        price: true,
        stock: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return grouped.map((item, index) => {
      const prod = productMap.get(item.productId);
      return {
        rank: index + 1,
        productId: item.productId,
        product: prod || null,
        totalReviews: item._count.id,
        averageRating: item._avg.rating ? Math.round(item._avg.rating * 10) / 10 : 0,
      };
    });
  }
}

export const reviewService = new ReviewService();
export default reviewService;
