import { prisma } from "../../config/prisma";
import {
  WishlistResponse,
  WishlistItemResponse,
  ToggleWishlistResponse,
} from "./wishlist.types";

export class WishlistService {
  /**
   * Helper: Format raw database wishlist item to formatted response
   */
  private formatWishlistItem(item: any): WishlistItemResponse {
    const product = item.product;
    const variant = item.variant;

    const effectiveStock = variant ? variant.stock : product.stock;
    const effectiveActive = variant
      ? variant.isActive && product.isActive
      : product.isActive;

    const isOutOfStock = !effectiveActive || effectiveStock <= 0;
    const effectivePrice = variant ? variant.price : product.price;
    const effectiveComparePrice = variant
      ? variant.comparePrice
      : product.comparePrice;
    const thumbnail = variant
      ? variant.thumbnail || variant.images?.[0] || product.thumbnail || product.images?.[0] || null
      : product.thumbnail || product.images?.[0] || null;

    return {
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      variantId: item.variantId || null,
      variant: variant
        ? {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            comparePrice: variant.comparePrice,
            stock: variant.stock,
            thumbnail: variant.thumbnail || variant.images?.[0] || null,
            images: variant.images || [],
            attributes: (variant.attributes as Record<string, string>) || {},
            isActive: variant.isActive,
          }
        : null,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        comparePrice: effectiveComparePrice,
        stock: effectiveStock,
        sku: variant ? variant.sku : product.sku,
        thumbnail,
        images: variant && variant.images?.length > 0 ? variant.images : product.images || [],
        isActive: effectiveActive,
        isFeatured: product.isFeatured,
        category: product.category
          ? {
              id: product.category.id,
              name: product.category.name,
              slug: product.category.slug,
            }
          : undefined,
      },
      isOutOfStock,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * 1. Get all items in user's wishlist
   */
  async getWishlist(userId: string): Promise<WishlistResponse> {
    const rawItems = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        variant: true,
      },
    });

    const items = rawItems.map((item) => this.formatWishlistItem(item));

    return {
      items,
      totalItems: items.length,
    };
  }

  /**
   * 2. Add product to user's wishlist (idempotent)
   */
  async addToWishlist(userId: string, productId: string, variantId?: string | null): Promise<WishlistResponse> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    if (!product.isActive) {
      throw new Error(`Product "${product.name}" is currently unavailable.`);
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
        variantId: variantId ? variantId : null,
      },
    });

    if (!existing) {
      await prisma.wishlistItem.create({
        data: {
          userId,
          productId,
          variantId: variantId ? variantId : null,
        },
      });
    }

    return this.getWishlist(userId);
  }

  /**
   * 3. Remove product from user's wishlist
   */
  async removeFromWishlist(
    userId: string,
    productId: string,
    variantId?: string | null
  ): Promise<WishlistResponse> {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId,
        productId,
        ...(variantId !== undefined ? { variantId: variantId ? variantId : null } : {}),
      },
    });

    return this.getWishlist(userId);
  }

  /**
   * 4. Toggle product in user's wishlist
   */
  async toggleWishlist(
    userId: string,
    productId: string,
    variantId?: string | null
  ): Promise<ToggleWishlistResponse> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
        variantId: variantId ? variantId : null,
      },
    });

    let inWishlist: boolean;
    let message: string;

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      inWishlist = false;
      message = `"${product.name}" removed from your wishlist.`;
    } else {
      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is currently unavailable.`);
      }

      await prisma.wishlistItem.create({
        data: {
          userId,
          productId,
          variantId: variantId ? variantId : null,
        },
      });
      inWishlist = true;
      message = `"${product.name}" added to your wishlist!`;
    }

    const wishlist = await this.getWishlist(userId);

    return {
      inWishlist,
      message,
      productId,
      variantId,
      wishlist,
    };
  }

  /**
   * 5. Clear all items from user's wishlist
   */
  async clearWishlist(userId: string): Promise<WishlistResponse> {
    await prisma.wishlistItem.deleteMany({
      where: { userId },
    });

    return {
      items: [],
      totalItems: 0,
    };
  }
}

export default new WishlistService();
