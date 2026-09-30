import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getToken, clearAuthStorage } from "../utils/localStorage";

export const setupInterceptors = (axiosInstance: AxiosInstance): AxiosInstance => {
  // Request Interceptor: Attach JWT Bearer token if present
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Global 401 Unauthorized handling
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response && error.response.status === 401) {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          clearAuthStorage();
        }
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
