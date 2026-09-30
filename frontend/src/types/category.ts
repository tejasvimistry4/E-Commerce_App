export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  parentId: string | null;
  vendorId?: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: Category[];
  _count?: {
    children: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
  parentId?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
  parentId?: string | null;
}

export interface CategoryListResponse {
  success: boolean;
  message: string;
  count: number;
  data: {
    categories: Category[];
  };
}

export interface CategoryTreeResponse {
  success: boolean;
  message: string;
  data: {
    categories: Category[];
  };
}

export interface CategorySingleResponse {
  success: boolean;
  message: string;
  data: {
    category: Category;
  };
}
