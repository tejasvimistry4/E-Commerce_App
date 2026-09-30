import { Banner, BannerType } from "@prisma/client";

export { Banner, BannerType };

export interface CreateBannerDTO {
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
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

export interface UpdateBannerDTO extends Partial<CreateBannerDTO> {}

export interface BannerFilterQuery {
  type?: BannerType;
  isActive?: string | boolean;
  search?: string;
  page?: string | number;
  limit?: string | number;
}
