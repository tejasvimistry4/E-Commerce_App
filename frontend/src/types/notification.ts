export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "ORDER_REFUNDED"
  | "LOW_STOCK"
  | "LOW_STOCK_ALERT"
  | "OUT_OF_STOCK_ALERT"
  | "SYSTEM_ALERT"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: NotificationPagination;
}

export interface NotificationFilterParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}
