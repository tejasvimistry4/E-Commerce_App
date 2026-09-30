import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Order,
  SavedAddress,
  OrderStats,
  OrderPagination,
  CreateOrderPayload,
  CreateReturnPayload,
  UpdateReturnStatusPayload,
  VerifyPaymentPayload,
  PaymentFailedPayload,
  RazorpayOrderPayload,
  ReturnRequest,
  OrderStatus,
  PaymentStatus,
} from "../../types/order";
import {
  createOrderApi,
  verifyPaymentApi,
  reportPaymentFailedApi,
  retryPaymentApi,
  getUserAddressesApi,
  getMyOrdersApi,
  getMyOrderByIdApi,
  cancelMyOrderApi,
  requestOrderReturnApi,
  getMyReturnsApi,
  getMyOrderReturnApi,
  getAdminOrdersApi,
  getAdminOrderByIdApi,
  updateAdminOrderStatusApi,
  getAdminReturnsApi,
  getAdminReturnByIdApi,
  updateAdminReturnStatusApi,
  getAdminOrderStatsApi,
} from "../../api/order.api";
import { clearCart } from "../cart/cartSlice";

// 1. Place Order (Checkout)
export const placeOrder = createAsyncThunk<
  { order: Order; razorpay?: RazorpayOrderPayload },
  CreateOrderPayload,
  { rejectValue: string }
>("order/placeOrder", async (payload, { rejectWithValue, dispatch }) => {
  try {
    const res = await createOrderApi(payload);
    // If COD, clear cart immediately
    if (!res.razorpay) {
      dispatch(clearCart());
    }
    return { order: res.data, razorpay: res.razorpay };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to place order. Please try again."
    );
  }
});

// 1a. Verify Razorpay Payment Signature
export const verifyPayment = createAsyncThunk<
  Order,
  VerifyPaymentPayload,
  { rejectValue: string }
>("order/verifyPayment", async (payload, { rejectWithValue, dispatch }) => {
  try {
    const res = await verifyPaymentApi(payload);
    dispatch(clearCart());
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to verify payment. Please check with support."
    );
  }
});

// 1b. Report Payment Failure
export const reportPaymentFailed = createAsyncThunk<
  Order,
  PaymentFailedPayload,
  { rejectValue: string }
>("order/reportPaymentFailed", async (payload, { rejectWithValue }) => {
  try {
    const res = await reportPaymentFailedApi(payload);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to report payment failure."
    );
  }
});

// 1c. Retry Order Payment
export const retryOrderPayment = createAsyncThunk<
  { order: Order; razorpay?: RazorpayOrderPayload },
  string,
  { rejectValue: string }
>("order/retryOrderPayment", async (orderId, { rejectWithValue }) => {
  try {
    const res = await retryPaymentApi(orderId);
    return { order: res.data, razorpay: res.razorpay };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to initiate payment retry."
    );
  }
});

// 2. Fetch Customer's Orders
export const fetchMyOrders = createAsyncThunk<
  { orders: Order[]; pagination: OrderPagination },
  { page?: number; limit?: number; status?: string; search?: string } | undefined,
  { rejectValue: string }
>("order/fetchMyOrders", async (params, { rejectWithValue }) => {
  try {
    const res = await getMyOrdersApi(params);
    return { orders: res.data, pagination: res.pagination };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load your orders."
    );
  }
});

// 3. Fetch Single Order Details (Customer)
export const fetchMyOrderById = createAsyncThunk<
  Order,
  string,
  { rejectValue: string }
>("order/fetchMyOrderById", async (orderId, { rejectWithValue }) => {
  try {
    const res = await getMyOrderByIdApi(orderId);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Order not found."
    );
  }
});

// 4. Cancel Order (Customer)
export const cancelOrder = createAsyncThunk<
  Order,
  { id: string; reason: string },
  { rejectValue: string }
>("order/cancelOrder", async ({ id, reason }, { rejectWithValue }) => {
  try {
    const res = await cancelMyOrderApi(id, reason);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to cancel order."
    );
  }
});

// 5. Customer: Request Order Return
export const requestOrderReturn = createAsyncThunk<
  ReturnRequest,
  { orderId: string; payload: CreateReturnPayload },
  { rejectValue: string }
>("order/requestOrderReturn", async ({ orderId, payload }, { rejectWithValue }) => {
  try {
    const res = await requestOrderReturnApi(orderId, payload);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to submit return request."
    );
  }
});

// 6. Customer: Fetch My Returns
export const fetchMyReturns = createAsyncThunk<
  { returns: ReturnRequest[]; pagination: OrderPagination },
  { page?: number; limit?: number; status?: string; search?: string } | undefined,
  { rejectValue: string }
>("order/fetchMyReturns", async (params, { rejectWithValue }) => {
  try {
    const res = await getMyReturnsApi(params);
    return { returns: res.data, pagination: res.pagination };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load returns."
    );
  }
});

// 7. Customer: Fetch Return Details for Order
export const fetchMyOrderReturn = createAsyncThunk<
  ReturnRequest,
  string,
  { rejectValue: string }
>("order/fetchMyOrderReturn", async (orderId, { rejectWithValue }) => {
  try {
    const res = await getMyOrderReturnApi(orderId);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Return request details not found."
    );
  }
});

// 8. Fetch Saved Addresses
export const fetchSavedAddresses = createAsyncThunk<
  SavedAddress[],
  void,
  { rejectValue: string }
>("order/fetchSavedAddresses", async (_, { rejectWithValue }) => {
  try {
    const res = await getUserAddressesApi();
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load saved addresses."
    );
  }
});

// 9. Admin: Fetch All Orders
export const fetchAdminOrders = createAsyncThunk<
  { orders: Order[]; pagination: OrderPagination },
  { page?: number; limit?: number; status?: string; search?: string } | undefined,
  { rejectValue: string }
>("order/fetchAdminOrders", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminOrdersApi(params);
    return { orders: res.data, pagination: res.pagination };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load orders for admin."
    );
  }
});

// 10. Admin: Fetch Single Order
export const fetchAdminOrderById = createAsyncThunk<
  Order,
  string,
  { rejectValue: string }
>("order/fetchAdminOrderById", async (orderId, { rejectWithValue }) => {
  try {
    const res = await getAdminOrderByIdApi(orderId);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Order not found."
    );
  }
});

// 11. Admin: Update Order Status
export const updateAdminOrderStatus = createAsyncThunk<
  Order,
  { id: string; status: OrderStatus; paymentStatus?: PaymentStatus; notes?: string },
  { rejectValue: string }
>("order/updateAdminOrderStatus", async ({ id, ...rest }, { rejectWithValue }) => {
  try {
    const res = await updateAdminOrderStatusApi(id, rest);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update order status."
    );
  }
});

// 12. Admin: Fetch All Return Requests
export const fetchAdminReturns = createAsyncThunk<
  { returns: ReturnRequest[]; pagination: OrderPagination },
  { page?: number; limit?: number; status?: string; search?: string } | undefined,
  { rejectValue: string }
>("order/fetchAdminReturns", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminReturnsApi(params);
    return { returns: res.data, pagination: res.pagination };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load return requests for admin."
    );
  }
});

// 13. Admin: Fetch Single Return Request
export const fetchAdminReturnById = createAsyncThunk<
  ReturnRequest,
  string,
  { rejectValue: string }
>("order/fetchAdminReturnById", async (returnId, { rejectWithValue }) => {
  try {
    const res = await getAdminReturnByIdApi(returnId);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Return request not found."
    );
  }
});

// 14. Admin: Update Return Status
export const updateAdminReturnStatus = createAsyncThunk<
  ReturnRequest,
  { id: string; payload: UpdateReturnStatusPayload },
  { rejectValue: string }
>("order/updateAdminReturnStatus", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await updateAdminReturnStatusApi(id, payload);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update return status."
    );
  }
});

// 15. Admin: Fetch Stats
export const fetchAdminOrderStats = createAsyncThunk<
  OrderStats,
  void,
  { rejectValue: string }
>("order/fetchAdminOrderStats", async (_, { rejectWithValue }) => {
  try {
    const res = await getAdminOrderStatsApi();
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load order statistics."
    );
  }
});
