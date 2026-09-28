export type BannerType = "FESTIVAL" | "SEASONAL" | "SALE" | "PROMOTIONAL" | "GENERAL";

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  type: BannerType;
  badgeText: string | null;
  buttonText: string | null;
  link: string | null;
  image: string | null;
  mobileImage: string | null;
  bgGradient: string | null;
  textColor: string | null;
  isActive: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerRequest {
  title: string;
  subtitle?: string;
  description?: string;
  type?: BannerType;
  badgeText?: string;
  buttonText?: string;
  link?: string;
  image?: string;
  mobileImage?: string;
  bgGradient?: string;
  textColor?: string;
  isActive?: boolean;
  priority?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateBannerRequest extends Partial<CreateBannerRequest> {}

export interface BannerFilterParams {
  type?: BannerType | "ALL";
  isActive?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ActiveBannersResponse {
  success: boolean;
  data: Banner[];
  count: number;
}

export interface AdminBannersResponse {
  success: boolean;
  banners: Banner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SingleBannerResponse {
  success: boolean;
  data: Banner;
  message?: string;
}
