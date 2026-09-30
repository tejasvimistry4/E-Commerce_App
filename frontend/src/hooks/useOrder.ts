import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
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
  clearCurrentOrder,
  clearCurrentReturn,
  clearOrderError,
} from "../redux/order/orderSlice";
import { downloadOrderPdfApi } from "../api/order.api";
import {
  selectOrders,
  selectCurrentOrder,
  selectSavedAddresses,
  selectAdminOrders,
  selectAdminStats,
  selectOrderPagination,
  selectAdminOrderPagination,
  selectReturns,
  selectCurrentReturn,
  selectReturnPagination,
  selectAdminReturns,
  selectAdminReturnPagination,
  selectOrderLoading,
  selectOrderActionLoading,
  selectOrderError,
} from "../redux/order/selectors";
import {
  CreateOrderPayload,
  VerifyPaymentPayload,
  PaymentFailedPayload,
  CreateReturnPayload,
  UpdateReturnStatusPayload,
  OrderStatus,
  PaymentStatus,
} from "../types/order";


export const useOrder = () => {
  const dispatch = useAppDispatch();

  const orders = useAppSelector(selectOrders);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const savedAddresses = useAppSelector(selectSavedAddresses);
  const adminOrders = useAppSelector(selectAdminOrders);
  const adminStats = useAppSelector(selectAdminStats);
  const pagination = useAppSelector(selectOrderPagination);
  const adminPagination = useAppSelector(selectAdminOrderPagination);
  const returns = useAppSelector(selectReturns);
  const currentReturn = useAppSelector(selectCurrentReturn);
  const returnPagination = useAppSelector(selectReturnPagination);
  const adminReturns = useAppSelector(selectAdminReturns);
  const adminReturnPagination = useAppSelector(selectAdminReturnPagination);
  const loading = useAppSelector(selectOrderLoading);
  const actionLoading = useAppSelector(selectOrderActionLoading);
  const error = useAppSelector(selectOrderError);

  const handlePlaceOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      return dispatch(placeOrder(payload)).unwrap();
    },
    [dispatch]
  );

  const handleVerifyPayment = useCallback(
    async (payload: VerifyPaymentPayload) => {
      return dispatch(verifyPayment(payload)).unwrap();
    },
    [dispatch]
  );

  const handleReportPaymentFailed = useCallback(
    async (payload: PaymentFailedPayload) => {
      return dispatch(reportPaymentFailed(payload)).unwrap();
    },
    [dispatch]
  );

  const handleRetryPayment = useCallback(
    async (orderId: string) => {
      return dispatch(retryOrderPayment(orderId)).unwrap();
    },
    [dispatch]
  );


  const handleFetchMyOrders = useCallback(
    (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      return dispatch(fetchMyOrders(params));
    },
    [dispatch]
  );

  const handleFetchOrderById = useCallback(
    (id: string) => {
      return dispatch(fetchMyOrderById(id));
    },
    [dispatch]
  );

  const handleCancelOrder = useCallback(
    (id: string, reason: string) => {
      return dispatch(cancelOrder({ id, reason })).unwrap();
    },
    [dispatch]
  );

  const handleRequestReturn = useCallback(
    (orderId: string, payload: CreateReturnPayload) => {
      return dispatch(requestOrderReturn({ orderId, payload })).unwrap();
    },
    [dispatch]
  );

  const handleFetchMyReturns = useCallback(
    (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      return dispatch(fetchMyReturns(params));
    },
    [dispatch]
  );

  const handleFetchOrderReturn = useCallback(
    (orderId: string) => {
      return dispatch(fetchMyOrderReturn(orderId));
    },
    [dispatch]
  );

  const handleFetchAddresses = useCallback(() => {
    return dispatch(fetchSavedAddresses());
  }, [dispatch]);

  const handleFetchAdminOrders = useCallback(
    (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      return dispatch(fetchAdminOrders(params));
    },
    [dispatch]
  );

  const handleFetchAdminOrderById = useCallback(
    (id: string) => {
      return dispatch(fetchAdminOrderById(id));
    },
    [dispatch]
  );

  const handleUpdateAdminStatus = useCallback(
    (id: string, status: OrderStatus, paymentStatus?: PaymentStatus, notes?: string) => {
      return dispatch(
        updateAdminOrderStatus({ id, status, paymentStatus, notes })
      ).unwrap();
    },
    [dispatch]
  );

  const handleFetchAdminReturns = useCallback(
    (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      return dispatch(fetchAdminReturns(params));
    },
    [dispatch]
  );

  const handleFetchAdminReturnById = useCallback(
    (returnId: string) => {
      return dispatch(fetchAdminReturnById(returnId));
    },
    [dispatch]
  );

  const handleUpdateAdminReturnStatus = useCallback(
    (id: string, payload: UpdateReturnStatusPayload) => {
      return dispatch(updateAdminReturnStatus({ id, payload })).unwrap();
    },
    [dispatch]
  );

  const handleFetchAdminStats = useCallback(() => {
    return dispatch(fetchAdminOrderStats());
  }, [dispatch]);

  const handleClearCurrent = useCallback(() => {
    dispatch(clearCurrentOrder());
  }, [dispatch]);

  const handleClearCurrentReturn = useCallback(() => {
    dispatch(clearCurrentReturn());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearOrderError());
  }, [dispatch]);

  const handleDownloadOrderPdf = useCallback(
    async (
      orderId: string,
      type: "order" | "invoice" = "order",
      options?: { isAdmin?: boolean; preview?: boolean; customFilename?: string }
    ) => {
      return downloadOrderPdfApi(orderId, type, options);
    },
    []
  );

  return {
    orders,
    currentOrder,
    savedAddresses,
    adminOrders,
    adminStats,
    pagination,
    adminPagination,
    returns,
    currentReturn,
    returnPagination,
    adminReturns,
    adminReturnPagination,
    loading,
    actionLoading,
    error,
    placeOrder: handlePlaceOrder,
    verifyPayment: handleVerifyPayment,
    reportPaymentFailed: handleReportPaymentFailed,
    retryPayment: handleRetryPayment,
    fetchMyOrders: handleFetchMyOrders,
    fetchOrderById: handleFetchOrderById,
    cancelOrder: handleCancelOrder,
    requestOrderReturn: handleRequestReturn,
    fetchMyReturns: handleFetchMyReturns,
    fetchOrderReturn: handleFetchOrderReturn,
    fetchSavedAddresses: handleFetchAddresses,
    fetchAdminOrders: handleFetchAdminOrders,
    fetchAdminOrderById: handleFetchAdminOrderById,
    updateAdminStatus: handleUpdateAdminStatus,
    fetchAdminReturns: handleFetchAdminReturns,
    fetchAdminReturnById: handleFetchAdminReturnById,
    updateAdminReturnStatus: handleUpdateAdminReturnStatus,
    fetchAdminStats: handleFetchAdminStats,
    downloadOrderPdf: handleDownloadOrderPdf,
    clearCurrentOrder: handleClearCurrent,
    clearCurrentReturn: handleClearCurrentReturn,
    clearOrderError: handleClearError,
  };
};

