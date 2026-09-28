import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  NotificationFilterParams,
  NotificationItem,
  NotificationListResponse,
  NotificationPagination,
} from "../../types/notification";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markAllAsReadApi,
  deleteNotificationApi,
  clearAllNotificationsApi,
} from "../../api/notification.api";
import { logoutUser } from "../auth/authSlice";

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: NotificationPagination;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialPagination: NotificationPagination = {
  total: 0,
  page: 1,
  limit: 15,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  pagination: initialPagination,
  loading: false,
  actionLoading: false,
  error: null,
};

/**
 * 1. Fetch Paginated Notifications
 */
export const fetchNotifications = createAsyncThunk<
  NotificationListResponse,
  NotificationFilterParams | undefined,
  { rejectValue: string }
>("notifications/fetchNotifications", async (params, { rejectWithValue }) => {
  try {
    const res = await getNotificationsApi(params);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to load notifications");
  }
});

/**
 * 2. Fetch Unread Count (Lightweight for navbar/badge)
 */
export const fetchUnreadCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notifications/fetchUnreadCount", async (_, { rejectWithValue }) => {
  try {
    const res = await getUnreadCountApi();
    return res.data.unreadCount;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch unread count");
  }
});

/**
 * 3. Mark Single Notification as Read
 */
export const markAsRead = createAsyncThunk<
  NotificationItem,
  string,
  { rejectValue: string }
>("notifications/markAsRead", async (notificationId, { rejectWithValue }) => {
  try {
    const res = await markAsReadApi(notificationId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to mark notification as read");
  }
});

/**
 * 4. Mark All Notifications as Read
 */
export const markAllAsRead = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notifications/markAllAsRead", async (_, { rejectWithValue }) => {
  try {
    const res = await markAllAsReadApi();
    return res.data.updatedCount;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to mark all as read");
  }
});

/**
 * 5. Delete Notification
 */
export const deleteNotification = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notifications/deleteNotification", async (notificationId, { rejectWithValue }) => {
  try {
    await deleteNotificationApi(notificationId);
    return notificationId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete notification");
  }
});

/**
 * 6. Clear All Notifications
 */
export const clearAllNotifications = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("notifications/clearAllNotifications", async (_, { rejectWithValue }) => {
  try {
    await clearAllNotificationsApi();
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to clear notifications");
  }
});

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    resetNotificationState: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = initialPagination;
      state.loading = false;
      state.actionLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<NotificationListResponse>) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load notifications";
      })

      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      })

      // Mark As Read (Optimistic update)
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<NotificationItem>) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          if (!state.notifications[index].isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications[index] = action.payload;
        }
      })

      // Mark All As Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        }));
        state.unreadCount = 0;
      })

      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action: PayloadAction<string>) => {
        const deleted = state.notifications.find((n) => n.id === action.payload);
        if (deleted && !deleted.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })

      // Clear All Notifications
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
        state.pagination.total = 0;
      })

      // On user logout, reset notifications
      .addCase(logoutUser, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
        state.pagination = initialPagination;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearNotificationError, resetNotificationState } = notificationSlice.actions;
export default notificationSlice.reducer;
