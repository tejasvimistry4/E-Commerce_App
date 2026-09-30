import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  CreateOrderPayload,
  VerifyPaymentPayload,
  PaymentFailedPayload,
  CreateReturnPayload,
  UpdateReturnStatusPayload,
  OrderSingleResponse,
  OrderListResponse,
  OrderStatsResponse,
  ReturnSingleResponse,
  ReturnListResponse,
  SavedAddress,
  OrderStatus,
  PaymentStatus,
} from "../types/order";

/**
 * 1. Place order (Checkout)
 */
export const createOrderApi = async (
  payload: CreateOrderPayload
): Promise<OrderSingleResponse> => {
  const response = await apiClient.post<OrderSingleResponse>(
    API_ENDPOINTS.ORDERS.CHECKOUT,
    payload
  );
  return response.data;
};

export {
  verifyPaymentApi,
  reportPaymentFailedApi,
  retryPaymentApi,
} from "./payment.api";



/**
 * 2. Get customer's saved addresses
 */
export const getUserAddressesApi = async (): Promise<{ success: boolean; data: SavedAddress[] }> => {
  const response = await apiClient.get<{ success: boolean; data: SavedAddress[] }>(
    API_ENDPOINTS.ORDERS.ADDRESSES
  );
  return response.data;
};

/**
 * 3. Get customer order history
 */
export const getMyOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<OrderListResponse> => {
  const response = await apiClient.get<OrderListResponse>(
    API_ENDPOINTS.ORDERS.MY_ORDERS,
    { params }
  );
  return response.data;
};

/**
 * 4. Get single order detail for customer
 */
export const getMyOrderByIdApi = async (id: string): Promise<OrderSingleResponse> => {
  const response = await apiClient.get<OrderSingleResponse>(
    API_ENDPOINTS.ORDERS.MY_ORDER_BY_ID(id)
  );
  return response.data;
};

/**
 * 5. Cancel order by customer
 */
export const cancelMyOrderApi = async (
  id: string,
  reason: string
): Promise<OrderSingleResponse> => {
  const response = await apiClient.post<OrderSingleResponse>(
    API_ENDPOINTS.ORDERS.CANCEL_MY_ORDER(id),
    { reason }
  );
  return response.data;
};

/**
 * 6. Customer: Request product return within 7 days
 */
export const requestOrderReturnApi = async (
  orderId: string,
  payload: CreateReturnPayload
): Promise<ReturnSingleResponse> => {
  const response = await apiClient.post<ReturnSingleResponse>(
    API_ENDPOINTS.ORDERS.REQUEST_RETURN(orderId),
    payload
  );
  return response.data;
};

/**
 * 7. Customer: Get customer's return requests
 */
export const getMyReturnsApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<ReturnListResponse> => {
  const response = await apiClient.get<ReturnListResponse>(
    API_ENDPOINTS.ORDERS.MY_RETURNS,
    { params }
  );
  return response.data;
};

/**
 * 8. Customer: Get return details for specific order
 */
export const getMyOrderReturnApi = async (orderId: string): Promise<ReturnSingleResponse> => {
  const response = await apiClient.get<ReturnSingleResponse>(
    API_ENDPOINTS.ORDERS.MY_ORDER_RETURN(orderId)
  );
  return response.data;
};

/**
 * 9. Admin: Get all orders
 */
export const getAdminOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<OrderListResponse> => {
  const response = await apiClient.get<OrderListResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_ALL,
    { params }
  );
  return response.data;
};

/**
 * 10. Admin: Get single order details
 */
export const getAdminOrderByIdApi = async (id: string): Promise<OrderSingleResponse> => {
  const response = await apiClient.get<OrderSingleResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_BY_ID(id)
  );
  return response.data;
};

/**
 * 11. Admin: Update order status
 */
export const updateAdminOrderStatusApi = async (
  id: string,
  payload: {
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    notes?: string;
  }
): Promise<OrderSingleResponse> => {
  const response = await apiClient.patch<OrderSingleResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_STATUS(id),
    payload
  );
  return response.data;
};

/**
 * 12. Admin: Get all return requests
 */
export const getAdminReturnsApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<ReturnListResponse> => {
  const response = await apiClient.get<ReturnListResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_RETURNS,
    { params }
  );
  return response.data;
};

/**
 * 13. Admin: Get return request by ID
 */
export const getAdminReturnByIdApi = async (id: string): Promise<ReturnSingleResponse> => {
  const response = await apiClient.get<ReturnSingleResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_RETURN_BY_ID(id)
  );
  return response.data;
};

/**
 * 14. Admin: Update return request status
 */
export const updateAdminReturnStatusApi = async (
  id: string,
  payload: UpdateReturnStatusPayload
): Promise<ReturnSingleResponse> => {
  const response = await apiClient.patch<ReturnSingleResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_RETURN_STATUS(id),
    payload
  );
  return response.data;
};

/**
 * 15. Admin: Get order statistics
 */
export const getAdminOrderStatsApi = async (): Promise<OrderStatsResponse> => {
  const response = await apiClient.get<OrderStatsResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_STATS
  );
  return response.data;
};

/**
 * 16. Download or preview Order Receipt / Tax Invoice PDF
 */
export const downloadOrderPdfApi = async (
  orderId: string,
  type: "order" | "invoice" = "order",
  options?: {
    isAdmin?: boolean;
    preview?: boolean;
    customFilename?: string;
  }
): Promise<void> => {
  const { isAdmin = false, preview = false, customFilename } = options || {};

  const url = isAdmin
    ? type === "invoice"
      ? API_ENDPOINTS.ORDERS.ADMIN_ORDER_INVOICE(orderId)
      : API_ENDPOINTS.ORDERS.ADMIN_ORDER_PDF(orderId)
    : type === "invoice"
      ? API_ENDPOINTS.ORDERS.MY_ORDER_INVOICE(orderId)
      : API_ENDPOINTS.ORDERS.MY_ORDER_PDF(orderId);

  const response = await apiClient.get(url, {
    responseType: "blob",
    params: {
      type,
      download: !preview,
    },
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const objectUrl = window.URL.createObjectURL(blob);

  if (preview) {
    window.open(objectUrl, "_blank");
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
  } else {
    // Extract filename from header or construct default
    const contentDisposition = response.headers["content-disposition"];
    let filename = customFilename;
    if (!filename && contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
    if (!filename) {
      filename = `${type === "invoice" ? "Invoice" : "Order"}-${orderId.substring(0, 8)}.pdf`;
    }

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  }
};


