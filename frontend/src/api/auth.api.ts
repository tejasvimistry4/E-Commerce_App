import { api } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  RegisterPayload,
  VendorRegisterPayload,
  VendorApprovalPayload,
  LoginPayload,
  GoogleAuthPayload,
  AuthUser,
  AuthResponse,
  UserProfileResponse,
  UsersListResponse,
  VendorsListResponse,
  VendorStatsResponse,
} from "../types/auth";

export type {
  RegisterPayload,
  VendorRegisterPayload,
  VendorApprovalPayload,
  LoginPayload,
  GoogleAuthPayload,
  AuthUser,
  AuthResponse,
  UserProfileResponse,
  UsersListResponse,
  VendorsListResponse,
  VendorStatsResponse,
};

export const registerApi = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    API_ENDPOINTS.AUTH.REGISTER,
    payload
  );
  return response.data;
};

export const registerVendorApi = async (
  payload: VendorRegisterPayload
): Promise<UserProfileResponse> => {
  const response = await api.post<UserProfileResponse>(
    API_ENDPOINTS.AUTH.VENDOR_REGISTER,
    payload
  );
  return response.data;
};

export const loginApi = async (
  payload: LoginPayload
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    payload
  );
  return response.data;
};

export const googleAuthApi = async (
  payload: GoogleAuthPayload
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    API_ENDPOINTS.AUTH.GOOGLE,
    payload
  );
  return response.data;
};

export const getMeApi = async (): Promise<UserProfileResponse> => {
  const response = await api.get<UserProfileResponse>(API_ENDPOINTS.AUTH.ME);
  return response.data;
};

export const getUsersApi = async (): Promise<UsersListResponse> => {
  const response = await api.get<UsersListResponse>(API_ENDPOINTS.AUTH.USERS);
  return response.data;
};

export const getAdminVendorsApi = async (params?: {
  status?: string;
  search?: string;
}): Promise<VendorsListResponse> => {
  const response = await api.get<VendorsListResponse>(
    API_ENDPOINTS.AUTH.ADMIN_VENDORS,
    { params }
  );
  return response.data;
};

export const getAdminVendorByIdApi = async (
  id: string
): Promise<UserProfileResponse> => {
  const response = await api.get<UserProfileResponse>(
    API_ENDPOINTS.AUTH.ADMIN_VENDOR_BY_ID(id)
  );
  return response.data;
};

export const updateVendorStatusApi = async (
  id: string,
  payload: VendorApprovalPayload
): Promise<UserProfileResponse> => {
  const response = await api.patch<UserProfileResponse>(
    API_ENDPOINTS.AUTH.ADMIN_VENDOR_STATUS(id),
    payload
  );
  return response.data;
};

export const getVendorStatsApi = async (): Promise<VendorStatsResponse> => {
  const response = await api.get<VendorStatsResponse>(
    API_ENDPOINTS.AUTH.VENDOR_STATS
  );
  return response.data;
};