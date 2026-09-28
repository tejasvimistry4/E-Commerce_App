import { RootState } from "../store";

export const selectOrderState = (state: RootState) => state.orders;
export const selectOrders = (state: RootState) => state.orders.orders;
export const selectCurrentOrder = (state: RootState) => state.orders.currentOrder;
export const selectSavedAddresses = (state: RootState) => state.orders.savedAddresses;
export const selectAdminOrders = (state: RootState) => state.orders.adminOrders;
export const selectAdminStats = (state: RootState) => state.orders.adminStats;
export const selectOrderPagination = (state: RootState) => state.orders.pagination;
export const selectAdminOrderPagination = (state: RootState) => state.orders.adminPagination;
export const selectReturns = (state: RootState) => state.orders.returns;
export const selectCurrentReturn = (state: RootState) => state.orders.currentReturn;
export const selectReturnPagination = (state: RootState) => state.orders.returnPagination;
export const selectAdminReturns = (state: RootState) => state.orders.adminReturns;
export const selectAdminReturnPagination = (state: RootState) => state.orders.adminReturnPagination;
export const selectOrderLoading = (state: RootState) => state.orders.loading;
export const selectOrderActionLoading = (state: RootState) => state.orders.actionLoading;
export const selectOrderError = (state: RootState) => state.orders.error;
