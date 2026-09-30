import { useAppDispatch, useAppSelector } from "./redux";
import {
  loginUser,
  registerUser,
  fetchCurrentUser,
  logoutUser,
  clearAuthError,
} from "../redux/auth/authSlice";
import { LoginPayload, RegisterPayload } from "../types/auth";
import { ROLES } from "../constants/roles";

export function useAuth() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const login = (payload: LoginPayload) => dispatch(loginUser(payload));
  const register = (payload: RegisterPayload) => dispatch(registerUser(payload));
  const fetchProfile = () => dispatch(fetchCurrentUser());
  const logout = () => dispatch(logoutUser());
  const clearError = () => dispatch(clearAuthError());

  const isAdmin = authState.user?.role === ROLES.SUPER_ADMIN;
  const isUser = authState.user?.role === ROLES.USER;

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    isAdmin,
    isUser,
    login,
    register,
    fetchProfile,
    logout,
    clearError,
  };
}

export default useAuth;
