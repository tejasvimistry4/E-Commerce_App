import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  VerifyPaymentPayload,
  PaymentFailedPayload,
  OrderSingleResponse,
} from "../types/order";

/**
 * 1. Verify Razorpay Payment Signature
 */
export const verifyPaymentApi = async (
  payload: VerifyPaymentPayload
): Promise<OrderSingleResponse> => {
  const response = await apiClient.post<OrderSingleResponse>(
    API_ENDPOINTS.PAYMENTS.VERIFY,
    payload
  );
  return response.data;
};

/**
 * 2. Report Payment Failure
 */
export const reportPaymentFailedApi = async (
  payload: PaymentFailedPayload
): Promise<OrderSingleResponse> => {
  const response = await apiClient.post<OrderSingleResponse>(
    API_ENDPOINTS.PAYMENTS.FAILED,
    payload
  );
  return response.data;
};

/**
 * 3. Retry Payment for an existing order
 */
export const retryPaymentApi = async (
  orderId: string
): Promise<OrderSingleResponse> => {
  const response = await apiClient.post<OrderSingleResponse>(
    API_ENDPOINTS.PAYMENTS.RETRY(orderId)
  );
  return response.data;
};
