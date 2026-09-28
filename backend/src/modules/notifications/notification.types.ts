import { NotificationType } from "@prisma/client";

export { NotificationType };

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface NotificationFilterParams {
  page?: number | string;
  limit?: number | string;
  unreadOnly?: boolean | string;
  type?: NotificationType | string;
}
