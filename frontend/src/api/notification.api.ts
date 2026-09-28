import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  NotificationFilterParams,
  NotificationItem,
  NotificationListResponse,
} from "../types/notification";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * 1. Get paginated notifications
 */
export const getNotificationsApi = async (
  params?: NotificationFilterParams
): Promise<ApiResponse<NotificationListResponse>> => {
  const response = await apiClient.get<ApiResponse<NotificationListResponse>>(
    API_ENDPOINTS.NOTIFICATIONS.BASE,
    { params }
  );
  return response.data;
};

/**
 * 2. Get unread notification count
 */
export const getUnreadCountApi = async (): Promise<ApiResponse<{ unreadCount: number }>> => {
  const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
    API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
  );
  return response.data;
};

/**
 * 3. Mark single notification as read
 */
export const markAsReadApi = async (
  notificationId: string
): Promise<ApiResponse<NotificationItem>> => {
  const response = await apiClient.patch<ApiResponse<NotificationItem>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)
  );
  return response.data;
};

/**
 * 4. Mark all notifications as read
 */
export const markAllAsReadApi = async (): Promise<ApiResponse<{ updatedCount: number }>> => {
  const response = await apiClient.patch<ApiResponse<{ updatedCount: number }>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ
  );
  return response.data;
};

/**
 * 5. Delete single notification
 */
export const deleteNotificationApi = async (
  notificationId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
    API_ENDPOINTS.NOTIFICATIONS.BY_ID(notificationId)
  );
  return response.data;
};

/**
 * 6. Clear all notifications
 */
export const clearAllNotificationsApi = async (): Promise<ApiResponse<{ deletedCount: number }>> => {
  const response = await apiClient.delete<ApiResponse<{ deletedCount: number }>>(
    API_ENDPOINTS.NOTIFICATIONS.BASE
  );
  return response.data;
};
