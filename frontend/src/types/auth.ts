import { Role } from "../constants/roles";

export type VendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  googleId?: string | null;
  vendorStatus?: VendorStatus | null;
  isActive?: boolean;
  businessName?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  businessDescription?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  adminFeedback?: string | null;
  createdAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface VendorRegisterPayload {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessPhone: string;
  businessAddress?: string;
  businessDescription?: string;
}

export interface VendorApprovalPayload {
  status: "APPROVED" | "REJECTED" | "INACTIVE";
  adminFeedback?: string;
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
    vendorStatus: VendorStatus;
    isActive: boolean;
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
  kpis?: {
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
  lowStockProducts?: any[];
  recentVisits?: any[];
  salesTrend?: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
  };
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

export interface UsersListResponse {
  success: boolean;
  message: string;
  data: {
    users: AuthUser[];
  };
}

export interface VendorsListResponse {
  success: boolean;
  message: string;
  data: {
    vendors: VendorListItem[];
    counts: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      inactive: number;
    };
  };
}

export interface VendorStatsResponse {
  success: boolean;
  message: string;
  data: VendorDashboardStats;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

