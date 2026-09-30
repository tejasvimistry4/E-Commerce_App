import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryFilterQuery,
  CategoryItem,
} from "./category.types";
import { CustomError } from "../../middleware/error.middleware";

// Helper: Slug generator
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Helper: Generate unique slug
export const generateUniqueSlug = async (
  name: string,
  preferredSlug?: string,
  excludeId?: string
): Promise<string> => {
  const baseSlug = preferredSlug ? slugify(preferredSlug) : slugify(name);
  let slug = baseSlug || "category";
  let counter = 1;

  while (true) {
    const existing = await (prisma as any).category.findUnique({
      where: { slug },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// 1. Get all categories
export const getAllCategories = async (
  query: CategoryFilterQuery = {},
  isAdmin = false,
  caller?: { id: string; role: string }
): Promise<CategoryItem[]> => {
  const where: any = {};

  if (!isAdmin) {
    where.isActive = true;
  } else if (query.isActive !== undefined) {
    where.isActive = query.isActive === "true" || query.isActive === true;
  }

  // Scoping for vendor vs super admin:
  // If caller is vendor and wants their categories, or storefront:
  if (caller && caller.role === "VENDOR") {
    // Vendor can see global platform categories (vendorId: null) AND their own (vendorId: caller.id)
    where.OR = [
      { vendorId: null },
      { vendorId: caller.id },
    ];
  } else if (query.vendorId) {
    where.vendorId = query.vendorId;
  }

  if (query.rootOnly === "true" || query.rootOnly === true) {
    where.parentId = null;
  } else if (query.parentId !== undefined) {
    where.parentId = query.parentId === "null" || query.parentId === null ? null : query.parentId;
  }

  // Search filter
  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    const searchConditions = [
      { name: { contains: term, mode: "insensitive" } },
      { slug: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchConditions },
      ];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  const categories = await (prisma as any).category.findMany({
    where,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: isAdmin ? undefined : { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          isActive: true,
          parentId: true,
          vendorId: true,
        },
        orderBy: { name: "asc" },
      },
      vendor: {
        select: {
          id: true,
          name: true,
          businessName: true,
        },
      },
      _count: {
        select: {
          children: true,
        },
      },
    },
    orderBy: [
      { parentId: "asc" },
      { name: "asc" },
    ],
  });

  return categories;
};

// 2. Get category tree hierarchy (Roots with nested children)
export const getCategoryTree = async (
  onlyActive = true
): Promise<CategoryItem[]> => {
  const rootCategories = await (prisma as any).category.findMany({
    where: {
      parentId: null,
      ...(onlyActive ? { isActive: true } : {}),
    },
    include: {
      children: {
        where: onlyActive ? { isActive: true } : undefined,
        include: {
          children: {
            where: onlyActive ? { isActive: true } : undefined,
          },
          _count: {
            select: { children: true },
          },
        },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { children: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return rootCategories;
};

// 3. Get category by ID
export const getCategoryById = async (
  id: string,
  isAdmin = false
): Promise<CategoryItem> => {
  const category = await (prisma as any).category.findUnique({
    where: { id },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: isAdmin ? undefined : { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          isActive: true,
          parentId: true,
          vendorId: true,
        },
        orderBy: { name: "asc" },
      },
      vendor: {
        select: {
          id: true,
          name: true,
          businessName: true,
        },
      },
      _count: {
        select: { children: true },
      },
    },
  });

  if (!category) {
    const error: CustomError = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (!isAdmin && !category.isActive) {
    const error: CustomError = new Error("Category is inactive or unavailable");
    error.statusCode = 404;
    throw error;
  }

  return category;
};

// 4. Get category by slug
export const getCategoryBySlug = async (
  slug: string,
  isAdmin = false
): Promise<CategoryItem> => {
  const category = await (prisma as any).category.findUnique({
    where: { slug: slug.toLowerCase() },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: isAdmin ? undefined : { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          isActive: true,
          parentId: true,
          vendorId: true,
        },
        orderBy: { name: "asc" },
      },
      vendor: {
        select: {
          id: true,
          name: true,
          businessName: true,
        },
      },
      _count: {
        select: { children: true },
      },
    },
  });

  if (!category) {
    const error: CustomError = new Error(`Category with slug '${slug}' not found`);
    error.statusCode = 404;
    throw error;
  }

  if (!isAdmin && !category.isActive) {
    const error: CustomError = new Error("Category is inactive or unavailable");
    error.statusCode = 404;
    throw error;
  }

  return category;
};

// 5. Create category (Super Admin or Vendor)
export const createCategory = async (
  data: CreateCategoryInput,
  vendorId?: string | null
): Promise<CategoryItem> => {
  // If parentId provided, verify it exists
  if (data.parentId) {
    const parentCategory = await (prisma as any).category.findUnique({
      where: { id: data.parentId },
    });

    if (!parentCategory) {
      const error: CustomError = new Error("Parent category not found");
      error.statusCode = 400;
      throw error;
    }
  }

  const slug = await generateUniqueSlug(data.name, data.slug);
  const assignedVendorId = vendorId !== undefined ? vendorId : data.vendorId || null;

  const category = await (prisma as any).category.create({
    data: {
      id: randomUUID(),
      name: data.name.trim(),
      slug,
      description: data.description ? data.description.trim() : null,
      image: data.image ? data.image.trim() : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      parentId: data.parentId || null,
      vendorId: assignedVendorId,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
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

  return category;
};

// 6. Update category with Ownership Enforcement
export const updateCategory = async (
  id: string,
  data: UpdateCategoryInput,
  caller?: { id: string; role: string }
): Promise<CategoryItem> => {
  const existingCategory = await (prisma as any).category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    const error: CustomError = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (caller && caller.role === "VENDOR") {
    if (existingCategory.vendorId !== caller.id) {
      const error: CustomError = new Error(
        "Forbidden. You do not have permission to modify this category."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Prevent self-referencing parent
  if (data.parentId && data.parentId === id) {
    const error: CustomError = new Error("A category cannot be its own parent");
    error.statusCode = 400;
    throw error;
  }

  // Verify parent exists if provided
  if (data.parentId) {
    const parentCategory = await (prisma as any).category.findUnique({
      where: { id: data.parentId },
    });

    if (!parentCategory) {
      const error: CustomError = new Error("Specified parent category does not exist");
      error.statusCode = 400;
      throw error;
    }

    // Check if new parent is currently a child of this category (avoid circular nesting)
    if (parentCategory.parentId === id) {
      const error: CustomError = new Error("Cannot set a child category as parent (circular hierarchy)");
      error.statusCode = 400;
      throw error;
    }
  }

  // Check slug uniqueness if updating name or slug
  let slug = existingCategory.slug;
  if (data.slug && data.slug !== existingCategory.slug) {
    slug = await generateUniqueSlug(data.slug, data.slug, id);
  } else if (data.name && data.name !== existingCategory.name && !data.slug) {
    slug = await generateUniqueSlug(data.name, undefined, id);
  }

  const updatedCategory = await (prisma as any).category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      slug,
      ...(data.description !== undefined && {
        description: data.description ? data.description.trim() : null,
      }),
      ...(data.image !== undefined && {
        image: data.image ? data.image.trim() : null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.parentId !== undefined && { parentId: data.parentId || null }),
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      vendor: {
        select: {
          id: true,
          name: true,
          businessName: true,
        },
      },
      _count: {
        select: { children: true },
      },
    },
  });

  return updatedCategory;
};

// 7. Toggle status with Ownership Enforcement
export const toggleCategoryStatus = async (
  id: string,
  caller?: { id: string; role: string }
): Promise<CategoryItem> => {
  const existing = await (prisma as any).category.findUnique({
    where: { id },
  });

  if (!existing) {
    const error: CustomError = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (caller && caller.role === "VENDOR") {
    if (existing.vendorId !== caller.id) {
      const error: CustomError = new Error(
        "Forbidden. You do not have permission to modify this category."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const updated = await (prisma as any).category.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return updated;
};

// 8. Delete category with Ownership Enforcement
export const deleteCategory = async (
  id: string,
  caller?: { id: string; role: string }
): Promise<{ id: string; name: string }> => {
  const existing = await (prisma as any).category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { children: true },
      },
    },
  });

  if (!existing) {
    const error: CustomError = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (caller && caller.role === "VENDOR") {
    if (existing.vendorId !== caller.id) {
      const error: CustomError = new Error(
        "Forbidden. You do not have permission to delete this category."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  await (prisma as any).category.delete({
    where: { id },
  });

  return {
    id: existing.id,
    name: existing.name,
  };
};
