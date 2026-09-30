export type RoleType = "USER" | "SUPER_ADMIN" | "ADMIN" | "VENDOR";

export type VendorStatusType = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface VendorRegisterInput {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  businessDescription?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  idToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  vendorStatus?: VendorStatusType | null;
  isActive: boolean;
  businessName?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  businessDescription?: string | null;
  approvedAt?: Date | string | null;
  rejectedAt?: Date | string | null;
  adminFeedback?: string | null;
  avatar?: string | null;
  googleId?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface AuthResponseData {
  user: AuthUser;
  token?: string;
}

export interface VendorStatusUpdateInput {
  status: VendorStatusType;
  adminFeedback?: string;
}

export interface VendorFilterQuery {
  status?: string;
  search?: string;
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VendorListItem extends AuthUser {
  productCount: number;
  activeProductCount: number;
  orderCount: number;
  totalRevenue: number;
  metrics?: {
    productsCount: number;
    activeProductsCount?: number;
    categoriesCount?: number;
    ordersCount: number;
    totalRevenue: number;
    averageRating: number;
    totalVisits: number;
  };
}

export interface VendorDashboardStats {
  vendor: {
    id: string;
    name: string;
    businessName: string | null;
    email: string;
    vendorStatus: VendorStatusType | null;
    isActive: boolean;
    approvedAt: Date | string | null;
  };
  metrics?: {
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCategories: number;
    totalReviews: number;
    averageRating: number;
    totalVisits: number;
    highlyInterestedLeads: number;
  };
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    lowStockCount: number;
    averageRating: number;
    totalReviews: number;
    totalVisits: number;
    highlyInterestedLeadsCount: number;
  };
  recentOrders: any[];
  topProducts?: any[];
  lowStockProducts: any[];
  salesTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}