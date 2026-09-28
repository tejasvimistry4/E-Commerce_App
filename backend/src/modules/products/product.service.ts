import { prisma } from "../../config/prisma";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryFilters,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from "./product.types";
import visualSearchService from "./visualSearch.service";
import searchService from "./search.service";
import cacheService from "../../services/cache.service";
import { CustomError } from "../../middleware/error.middleware";
import { notificationService } from "../notifications/notification.service";

export class ProductService {
  /**
   * Helper to generate a clean, URL-friendly slug
   */
  private generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Ensure unique slug in database
   */
  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      slug = `${baseSlug}-${count}`;
      count++;
    }
  }

  /**
   * 1. Get filtered, paginated products for Customer Storefront (Advanced Search & Filter)
   */
  async getProducts(filters: ProductQueryFilters = {}) {
    return searchService.searchProducts(filters);
  }

  /**
   * 2. Get Featured Products for showcases
   */
  async getFeaturedProducts(limit = 8) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: Math.min(24, limit),
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
      },
    });
  }

  /**
   * 3. Get single product by ID
   */
  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    return product;
  }

  /**
   * 4. Get single product by slug (with related products from same category)
   */
  async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error(`Product with slug "${slug}" not found.`);
    }

    // Fetch up to 4 related products from same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return {
      product,
      relatedProducts,
    };
  }

  /**
   * 5. Get all products with Admin metrics (Active and Inactive) - Scoped for Vendors & Super Admins
   */
  async getAdminProducts(filters: ProductQueryFilters = {}) {
    const where: any = {};

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = Boolean(filters.isActive);
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = Boolean(filters.isFeatured);
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
        {
          variants: {
            some: {
              sku: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    return products;
  }

  /**
   * 6. Create a new Product (with optional nested variants and vendor ownership)
   */
  async createProduct(dto: CreateProductDto, vendorId?: string | null) {
    // 1. Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new Error(`Category with ID "${dto.categoryId}" does not exist.`);
    }

    // 2. Generate unique slug
    const baseSlug = dto.slug && dto.slug.trim() ? this.generateSlug(dto.slug) : this.generateSlug(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // 3. Verify SKU uniqueness if provided
    if (dto.sku && dto.sku.trim()) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: dto.sku.trim() },
      });
      if (existingSku) {
        throw new Error(`Product with SKU "${dto.sku}" already exists.`);
      }
    }

    // Calculate aggregated stock if variants exist and stock is 0
    let initialStock = dto.stock !== undefined ? Number(dto.stock) : 0;
    if (dto.variants && dto.variants.length > 0) {
      const variantStockSum = dto.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
      if (variantStockSum > initialStock) {
        initialStock = variantStockSum;
      }
    }

    const assignedVendorId = vendorId || dto.vendorId || null;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description ? dto.description.trim() : null,
          price: Number(dto.price),
          comparePrice: dto.comparePrice ? Number(dto.comparePrice) : null,
          stock: initialStock,
          lowStockThreshold: dto.lowStockThreshold !== undefined ? Number(dto.lowStockThreshold) : 5,
          sku: dto.sku && dto.sku.trim() ? dto.sku.trim().toUpperCase() : null,
          images: Array.isArray(dto.images) ? dto.images.filter(Boolean) : [],
          thumbnail: dto.thumbnail ? dto.thumbnail.trim() : (dto.images?.[0] || null),
          isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
          isFeatured: dto.isFeatured !== undefined ? Boolean(dto.isFeatured) : false,
          categoryId: dto.categoryId,
          vendorId: assignedVendorId,
        },
      });

      // Create variants if provided
      if (dto.variants && Array.isArray(dto.variants) && dto.variants.length > 0) {
        for (const variant of dto.variants) {
          await tx.productVariant.create({
            data: {
              productId: created.id,
              sku: variant.sku && variant.sku.trim() ? variant.sku.trim().toUpperCase() : null,
              price: Number(variant.price !== undefined ? variant.price : dto.price),
              comparePrice: variant.comparePrice ? Number(variant.comparePrice) : null,
              stock: variant.stock !== undefined ? Number(variant.stock) : 0,
              lowStockThreshold: variant.lowStockThreshold !== undefined ? Number(variant.lowStockThreshold) : 5,
              images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
              thumbnail: variant.thumbnail ? variant.thumbnail.trim() : (variant.images?.[0] || null),
              attributes: variant.attributes || {},
              isActive: variant.isActive !== undefined ? Boolean(variant.isActive) : true,
              isDefault: Boolean(variant.isDefault),
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            orderBy: { createdAt: "asc" },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              businessName: true,
              email: true,
            },
          },
        },
      });
    });

    // Trigger visual embedding extraction in background
    visualSearchService.indexProductEmbeddings(product!.id).catch((err) => {
      console.warn(`[ProductService] Auto-embedding failed for product ${product!.id}:`, err);
    });

    // Invalidate search cache
    cacheService.delByPattern("search:*").catch(() => {});

    return product;
  }

  /**
   * 7. Update an existing Product with Ownership Enforcement
   */
  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    caller?: { id: string; role: string }
  ) {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    // Role & Ownership check: Vendors cannot edit other vendor or platform products
    if (caller && caller.role === "VENDOR") {
      if (existing.vendorId !== caller.id) {
        const error: CustomError = new Error(
          "Forbidden. You do not have permission to modify another vendor's product."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    // If category is changing, verify new category
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new Error(`Category with ID "${dto.categoryId}" does not exist.`);
      }
    }

    // If slug is changing
    let slug = existing.slug;
    if (dto.slug && dto.slug.trim() && dto.slug.trim() !== existing.slug) {
      const baseSlug = this.generateSlug(dto.slug);
      slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    // If SKU is changing, verify uniqueness
    if (dto.sku && dto.sku.trim() && dto.sku.trim() !== existing.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: dto.sku.trim() },
      });
      if (existingSku && existingSku.id !== id) {
        throw new Error(`Product with SKU "${dto.sku}" already exists.`);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If variants are supplied in update payload, synchronize them
      if (dto.variants && Array.isArray(dto.variants)) {
        const incomingVariantIds = dto.variants
          .map((v) => v.id)
          .filter((vid): vid is string => Boolean(vid));

        // Delete removed variants
        await tx.productVariant.deleteMany({
          where: {
            productId: id,
            id: { notIn: incomingVariantIds },
          },
        });

        // Upsert/create/update incoming variants
        for (const v of dto.variants) {
          if (v.id && existing.variants.some((ev) => ev.id === v.id)) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                ...(v.sku !== undefined && { sku: v.sku && v.sku.trim() ? v.sku.trim().toUpperCase() : null }),
                ...(v.price !== undefined && { price: Number(v.price) }),
                ...(v.comparePrice !== undefined && { comparePrice: v.comparePrice ? Number(v.comparePrice) : null }),
                ...(v.stock !== undefined && { stock: Number(v.stock) }),
                ...(v.images !== undefined && { images: Array.isArray(v.images) ? v.images.filter(Boolean) : [] }),
                ...(v.thumbnail !== undefined && { thumbnail: v.thumbnail ? v.thumbnail.trim() : null }),
                ...(v.attributes !== undefined && { attributes: v.attributes }),
                ...(v.isActive !== undefined && { isActive: Boolean(v.isActive) }),
                ...(v.isDefault !== undefined && { isDefault: Boolean(v.isDefault) }),
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku && v.sku.trim() ? v.sku.trim().toUpperCase() : null,
                price: Number(v.price !== undefined ? v.price : (dto.price || existing.price)),
                comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
                stock: v.stock !== undefined ? Number(v.stock) : 0,
                images: Array.isArray(v.images) ? v.images.filter(Boolean) : [],
                thumbnail: v.thumbnail ? v.thumbnail.trim() : (v.images?.[0] || null),
                attributes: v.attributes || {},
                isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
                isDefault: Boolean(v.isDefault),
              },
            });
          }
        }
      }

      // Compute total stock if variants exist
      let finalStock = dto.stock !== undefined ? Number(dto.stock) : existing.stock;
      if (dto.variants && dto.variants.length > 0) {
        const variantStockSum = dto.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
        if (variantStockSum > 0) {
          finalStock = variantStockSum;
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(slug !== existing.slug && { slug }),
          ...(dto.description !== undefined && { description: dto.description ? dto.description.trim() : null }),
          ...(dto.price !== undefined && { price: Number(dto.price) }),
          ...(dto.comparePrice !== undefined && { comparePrice: dto.comparePrice ? Number(dto.comparePrice) : null }),
          ...(dto.stock !== undefined || dto.variants ? { stock: finalStock } : {}),
          ...(dto.lowStockThreshold !== undefined && { lowStockThreshold: Number(dto.lowStockThreshold) }),
          ...(dto.sku !== undefined && { sku: dto.sku && dto.sku.trim() ? dto.sku.trim().toUpperCase() : null }),
          ...(dto.images !== undefined && { images: Array.isArray(dto.images) ? dto.images.filter(Boolean) : [] }),
          ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail ? dto.thumbnail.trim() : null }),
          ...(dto.isActive !== undefined && { isActive: Boolean(dto.isActive) }),
          ...(dto.isFeatured !== undefined && { isFeatured: Boolean(dto.isFeatured) }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            orderBy: { createdAt: "asc" },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              businessName: true,
              email: true,
            },
          },
        },
      });
    });

    // Trigger visual embedding update in background
    visualSearchService.indexProductEmbeddings(updated.id).catch((err) => {
      console.warn(`[ProductService] Auto-embedding update failed for product ${updated.id}:`, err);
    });

    // Check low stock on update
    notificationService.checkAndNotifyLowStock(updated.id).catch((err) => {
      console.warn("[ProductService] checkAndNotifyLowStock failed:", err);
    });

    // Invalidate search cache
    cacheService.delByPattern("search:*").catch(() => {});

    return updated;
  }

  /**
   * 8. Toggle Product Active Visibility with Ownership Enforcement
   */
  async toggleProductStatus(id: string, caller?: { id: string; role: string }) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    if (caller && caller.role === "VENDOR") {
      if (existing.vendorId !== caller.id) {
        const error: CustomError = new Error(
          "Forbidden. You do not have permission to modify another vendor's product."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: true,
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
      },
    });

    // Invalidate search cache
    cacheService.delByPattern("search:*").catch(() => {});

    return updated;
  }

  /**
   * 9. Delete Product with Ownership Enforcement
   */
  async deleteProduct(id: string, caller?: { id: string; role: string }) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    if (caller && caller.role === "VENDOR") {
      if (existing.vendorId !== caller.id) {
        const error: CustomError = new Error(
          "Forbidden. You do not have permission to delete another vendor's product."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    await prisma.product.delete({ where: { id } });

    // Invalidate search cache
    cacheService.delByPattern("search:*").catch(() => {});

    return {
      id,
      name: existing.name,
      deleted: true,
    };
  }

  /**
   * 10. Get Product Stats (Scoped for Vendors or Global for Super Admin)
   */
  async getProductStats(vendorId?: string) {
    const where: any = vendorId ? { vendorId } : {};
    const variantWhere: any = vendorId ? { product: { vendorId } } : {};

    const [total, active, outOfStock, featured, variantsCount] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.count({ where: { ...where, isActive: true } }),
      prisma.product.count({ where: { ...where, stock: 0 } }),
      prisma.product.count({ where: { ...where, isFeatured: true } }),
      prisma.productVariant.count({ where: variantWhere }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      outOfStock,
      inStock: total - outOfStock,
      featured,
      variantsCount,
    };
  }

  /**
   * ==========================================
   * Dedicated Product Variant CRUD Operations
   * ==========================================
   */

  /**
   * 11. Create a Variant for a Product with Ownership Enforcement
   */
  async createVariant(
    productId: string,
    dto: CreateProductVariantDto,
    caller?: { id: string; role: string }
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    if (caller && caller.role === "VENDOR") {
      if (product.vendorId !== caller.id) {
        const error: CustomError = new Error(
          "Forbidden. You do not have permission to modify another vendor's product."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    // Verify variant SKU uniqueness if provided
    if (dto.sku && dto.sku.trim()) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: dto.sku.trim() },
      });
      if (existingSku) {
        throw new Error(`Variant with SKU "${dto.sku}" already exists.`);
      }
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku && dto.sku.trim() ? dto.sku.trim().toUpperCase() : null,
        price: Number(dto.price),
        comparePrice: dto.comparePrice ? Number(dto.comparePrice) : null,
        stock: dto.stock !== undefined ? Number(dto.stock) : 0,
        images: Array.isArray(dto.images) ? dto.images.filter(Boolean) : [],
        thumbnail: dto.thumbnail ? dto.thumbnail.trim() : (dto.images?.[0] || null),
        attributes: dto.attributes || {},
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
        isDefault: Boolean(dto.isDefault),
      },
    });

    // Update product stock and re-index embeddings
    await this.recalculateProductStock(productId);
    visualSearchService.indexProductEmbeddings(productId).catch((err) => {
      console.warn(`[ProductService] Embedding update failed after variant creation:`, err);
    });

    return variant;
  }

  /**
   * 12. Update a Product Variant with Ownership Enforcement
   */
  async updateVariant(
    variantId: string,
    dto: UpdateProductVariantDto,
    caller?: { id: string; role: string }
  ) {
    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!existing) {
      throw new Error(`Product variant with ID "${variantId}" not found.`);
    }

    if (caller && caller.role === "VENDOR") {
      if (existing.product.vendorId !== caller.id) {
        const error: CustomError = new Error(
          "Forbidden. You do not have permission to modify another vendor's product variant."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    if (dto.sku && dto.sku.trim() && dto.sku.trim() !== existing.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: dto.sku.trim() },
      });
      if (existingSku && existingSku.id !== variantId) {
        throw new Error(`Variant with SKU "${dto.sku}" already exists.`);
      }
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(dto.sku !== undefined && { sku: dto.sku && dto.sku.trim() ? dto.sku.trim().toUpperCase() : null }),
        ...(dto.price !== undefined && { price: Number(dto.price) }),
        ...(dto.comparePrice !== undefined && { comparePrice: dto.comparePrice ? Number(dto.comparePrice) : null }),
        ...(dto.stock !== undefined && { stock: Number(dto.stock) }),
        ...(dto.images !== undefined && { images: Array.isArray(dto.images) ? dto.images.filter(Boolean) : [] }),
        ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail ? dto.thumbnail.trim() : null }),
        ...(dto.attributes !== undefined && { attributes: dto.attributes }),
        ...(dto.isActive !== undefined && { isActive: Boolean(dto.isActive) }),
        ...(dto.isDefault !== undefined && { isDefault: Boolean(dto.isDefault) }),
      },
    });

    await this.recalculateProductStock(existing.productId);
    visualSearchService.indexProductEmbeddings(existing.productId).catch((err) => {
      console.warn(`[ProductService] Embedding update failed after variant update:`, err);
    });

    // Check low stock on variant update
    notificationService.checkAndNotifyLowStock(existing.productId, variantId).catch((err) => {
      console.warn("[ProductService] checkAndNotifyLowStock failed:", err);
    });

    return updated;
  }

  /**
   * 13. Delete a Product Variant with Ownership Enforcement
   */
  async deleteVariant(variantId: string, caller?: { id: string; role: string }) {
    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!existing) {
      throw new Error(`Product variant with ID "${variantId}" not found.`);
    }

    if (caller && caller.role === "VENDOR") {
      if (existing.product.vendorId !== caller.id) {
        const error: CustomError = new Error(
          "Forbidden. You do not have permission to delete another vendor's product variant."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    await prisma.productVariant.delete({ where: { id: variantId } });

    await this.recalculateProductStock(existing.productId);
    visualSearchService.indexProductEmbeddings(existing.productId).catch((err) => {
      console.warn(`[ProductService] Embedding update failed after variant deletion:`, err);
    });

    return { id: variantId, deleted: true };
  }

  /**
   * 14. Get all variants for a product
   */
  async getProductVariants(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Helper: Recalculate and synchronize parent product stock from variants
   */
  private async recalculateProductStock(productId: string) {
    const variants = await prisma.productVariant.findMany({
      where: { productId, isActive: true },
      select: { stock: true },
    });

    if (variants.length > 0) {
      const totalVariantStock = variants.reduce((sum, v) => sum + v.stock, 0);
      await prisma.product.update({
        where: { id: productId },
        data: { stock: totalVariantStock },
      });
    }
  }
}

export default new ProductService();
