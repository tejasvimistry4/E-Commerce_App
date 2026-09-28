import { prisma } from "../../config/prisma";
import {
  Banner,
  CreateBannerDTO,
  UpdateBannerDTO,
  BannerFilterQuery,
} from "./banner.types";

export class BannerService {
  /**
   * Get currently active and scheduled banners for the storefront.
   * Filters by isActive=true and verifies the current date is within startDate and endDate if provided.
   */
  async getActiveBanners(): Promise<Banner[]> {
    const now = new Date();

    return prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });
  }

  /**
   * Get all banners for Admin panel with search and filtering.
   */
  async getAllBannersAdmin(query: BannerFilterQuery = {}) {
    const { type, isActive, search, page = 1, limit = 50 } = query;

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined && isActive !== "") {
      where.isActive = String(isActive) === "true" || isActive === true;
    }

    if (search && typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { subtitle: { contains: term, mode: "insensitive" } },
        { badgeText: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];
    }

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.banner.count({ where }),
    ]);

    return {
      banners,
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  /**
   * Get single banner by ID.
   */
  async getBannerById(id: string): Promise<Banner | null> {
    return prisma.banner.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new banner.
   */
  async createBanner(data: CreateBannerDTO): Promise<Banner> {
    return prisma.banner.create({
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        description: data.description?.trim() || null,
        type: data.type || "GENERAL",
        badgeText: data.badgeText?.trim() || null,
        buttonText: data.buttonText?.trim() || "Shop Now",
        link: data.link?.trim() || "/products",
        image: data.image?.trim() || null,
        mobileImage: data.mobileImage?.trim() || null,
        bgGradient:
          data.bgGradient?.trim() ||
          "from-indigo-950 via-slate-900 to-purple-950",
        textColor: data.textColor?.trim() || "text-white",
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        priority: Number(data.priority) || 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  /**
   * Update an existing banner.
   */
  async updateBanner(id: string, data: UpdateBannerDTO): Promise<Banner> {
    const existing = await this.getBannerById(id);
    if (!existing) {
      throw new Error(`Banner with ID "${id}" not found.`);
    }

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle?.trim() || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.badgeText !== undefined) updateData.badgeText = data.badgeText?.trim() || null;
    if (data.buttonText !== undefined) updateData.buttonText = data.buttonText?.trim() || "Shop Now";
    if (data.link !== undefined) updateData.link = data.link?.trim() || "/products";
    if (data.image !== undefined) updateData.image = data.image?.trim() || null;
    if (data.mobileImage !== undefined) updateData.mobileImage = data.mobileImage?.trim() || null;
    if (data.bgGradient !== undefined) updateData.bgGradient = data.bgGradient?.trim() || null;
    if (data.textColor !== undefined) updateData.textColor = data.textColor?.trim() || "text-white";
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.priority !== undefined) updateData.priority = Number(data.priority) || 0;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    return prisma.banner.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Toggle active/inactive status.
   */
  async toggleBannerStatus(id: string): Promise<Banner> {
    const existing = await this.getBannerById(id);
    if (!existing) {
      throw new Error(`Banner with ID "${id}" not found.`);
    }

    return prisma.banner.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });
  }

  /**
   * Delete banner.
   */
  async deleteBanner(id: string): Promise<Banner> {
    const existing = await this.getBannerById(id);
    if (!existing) {
      throw new Error(`Banner with ID "${id}" not found.`);
    }

    return prisma.banner.delete({
      where: { id },
    });
  }
}

export const bannerService = new BannerService();
export default bannerService;
