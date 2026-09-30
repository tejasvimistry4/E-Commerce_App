export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
  parentId?: string | null;
  vendorId?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
  parentId?: string | null;
}

export interface CategoryFilterQuery {
  isActive?: boolean | string;
  search?: string;
  parentId?: string | null;
  rootOnly?: boolean | string;
  vendorId?: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  parentId: string | null;
  vendorId?: string | null;
  vendor?: {
    id: string;
    name: string;
    businessName: string | null;
  } | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: CategoryItem[];
  _count?: {
    children: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}
