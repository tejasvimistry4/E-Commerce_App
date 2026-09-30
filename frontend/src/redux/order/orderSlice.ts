import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Order,
  SavedAddress,
  OrderStats,
  OrderPagination,
  RazorpayOrderPayload,
  ReturnRequest,
} from "../../types/order";
import {
  placeOrder,
  verifyPayment,
  reportPaymentFailed,
  retryOrderPayment,
  fetchMyOrders,
  fetchMyOrderById,
  cancelOrder,
  requestOrderReturn,
  fetchMyReturns,
  fetchMyOrderReturn,
  fetchSavedAddresses,
  fetchAdminOrders,
  fetchAdminOrderById,
  updateAdminOrderStatus,
  fetchAdminReturns,
  fetchAdminReturnById,
  updateAdminReturnStatus,
  fetchAdminOrderStats,
} from "./orderThunk";

export * from "./orderThunk";

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  savedAddresses: SavedAddress[];
  adminOrders: Order[];
  adminStats: OrderStats | null;
  pagination: OrderPagination | null;
  adminPagination: OrderPagination | null;
  returns: ReturnRequest[];
  currentReturn: ReturnRequest | null;
  returnPagination: OrderPagination | null;
  adminReturns: ReturnRequest[];
  adminReturnPagination: OrderPagination | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  savedAddresses: [],
  adminOrders: [],
  adminStats: null,
  pagination: null,
  adminPagination: null,
  returns: [],
  currentReturn: null,
  returnPagination: null,
  adminReturns: [],
  adminReturnPagination: null,
  loading: false,
  actionLoading: false,
  error: null,
};

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearCurrentReturn: (state) => {
      state.currentReturn = null;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action: PayloadAction<{ order: Order; razorpay?: RazorpayOrderPayload }>) => {
        state.actionLoading = false;
        state.currentOrder = action.payload.order;
        // Avoid duplicate in orders array if already exists
        const exists = state.orders.some((o) => o.id === action.payload.order.id);
        if (!exists) {
          state.orders.unshift(action.payload.order);
        }
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to place order";
      })

      // Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action: PayloadAction<Order>) => {
        state.actionLoading = false;
        state.currentOrder = action.payload;
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.orders[idx] = action.payload;
        } else {
          state.orders.unshift(action.payload);
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to verify payment";
      })

      // Report Payment Failure
      .addCase(reportPaymentFailed.fulfilled, (state, action: PayloadAction<Order>) => {
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.orders[idx] = action.payload;
        }
      })

      // Retry Order Payment
      .addCase(retryOrderPayment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(retryOrderPayment.fulfilled, (state, action: PayloadAction<{ order: Order; razorpay?: RazorpayOrderPayload }>) => {
        state.actionLoading = false;
        state.currentOrder = action.payload.order;
        const idx = state.orders.findIndex((o) => o.id === action.payload.order.id);
        if (idx >= 0) {
          state.orders[idx] = action.payload.order;
        }
      })
      .addCase(retryOrderPayment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to initiate payment retry";
      })

      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load orders";
      })

      // Fetch Single Order (Customer)
      .addCase(fetchMyOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrderById.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchMyOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Order not found";
      })

      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.actionLoading = false;
        state.currentOrder = action.payload;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to cancel order";
      })

      // Customer: Request Return
      .addCase(requestOrderReturn.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(requestOrderReturn.fulfilled, (state, action: PayloadAction<ReturnRequest>) => {
        state.actionLoading = false;
        state.currentReturn = action.payload;
        if (state.currentOrder && state.currentOrder.id === action.payload.orderId) {
          state.currentOrder.returnRequest = action.payload;
        }
        const orderIndex = state.orders.findIndex((o) => o.id === action.payload.orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].returnRequest = action.payload;
        }
        state.returns.unshift(action.payload);
      })
      .addCase(requestOrderReturn.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to submit return request";
      })

      // Customer: Fetch Returns
      .addCase(fetchMyReturns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.returns = action.payload.returns;
        state.returnPagination = action.payload.pagination;
      })
      .addCase(fetchMyReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load returns";
      })

      // Customer: Fetch Single Return
      .addCase(fetchMyOrderReturn.fulfilled, (state, action: PayloadAction<ReturnRequest>) => {
        state.currentReturn = action.payload;
        if (state.currentOrder && state.currentOrder.id === action.payload.orderId) {
          state.currentOrder.returnRequest = action.payload;
        }
      })

      // Fetch Saved Addresses
      .addCase(fetchSavedAddresses.fulfilled, (state, action: PayloadAction<SavedAddress[]>) => {
        state.savedAddresses = action.payload;
      })

      // Admin: Fetch All Orders
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.adminOrders = action.payload.orders;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load admin orders";
      })

      // Admin: Fetch Single Order
      .addCase(fetchAdminOrderById.fulfilled, (state, action: PayloadAction<Order>) => {
        state.currentOrder = action.payload;
      })

      // Admin: Update Status
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action: PayloadAction<Order>) => {
        state.actionLoading = false;
        state.currentOrder = action.payload;
        const index = state.adminOrders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.adminOrders[index] = action.payload;
        }
      })
      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update status";
      })

      // Admin: Fetch All Returns
      .addCase(fetchAdminReturns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.adminReturns = action.payload.returns;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAdminReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load return requests for admin";
      })

      // Admin: Fetch Single Return
      .addCase(fetchAdminReturnById.fulfilled, (state, action: PayloadAction<ReturnRequest>) => {
        state.currentReturn = action.payload;
      })

      // Admin: Update Return Status
      .addCase(updateAdminReturnStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAdminReturnStatus.fulfilled, (state, action: PayloadAction<ReturnRequest>) => {
        state.actionLoading = false;
        state.currentReturn = action.payload;
        const retIndex = state.adminReturns.findIndex((r) => r.id === action.payload.id);
        if (retIndex !== -1) {
          state.adminReturns[retIndex] = action.payload;
        }
        if (state.currentOrder && state.currentOrder.id === action.payload.orderId) {
          state.currentOrder.returnRequest = action.payload;
        }
      })
      .addCase(updateAdminReturnStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update return status";
      })

      // Admin: Stats
      .addCase(fetchAdminOrderStats.fulfilled, (state, action: PayloadAction<OrderStats>) => {
        state.adminStats = action.payload;
      });
  },
});

export const { clearCurrentOrder, clearCurrentReturn, clearOrderError } = orderSlice.actions;

export default orderSlice.reducer;
