import {
  loginApi,
  registerApi,
  getMeApi,
  getUsersApi,
} from "../api/auth.api";
import {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  UserProfileResponse,
  UsersListResponse,
} from "../types/auth";
import {
  getToken,
  setToken,
  getUser,
  setUser,
  clearAuthStorage,
} from "../utils/localStorage";

export class AuthService {
  static async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await loginApi(payload);
    if (res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  }

  static async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await registerApi(payload);
    if (res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  }

  static async getCurrentUser(): Promise<UserProfileResponse> {
    const res = await getMeApi();
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res;
  }

  static async getAllUsers(): Promise<UsersListResponse> {
    return getUsersApi();
  }

  static logout(): void {
    clearAuthStorage();
  }

  static getStoredToken(): string | null {
    return getToken();
  }

  static getStoredUser() {
    return getUser();
  }

  static isAuthenticated(): boolean {
    return Boolean(getToken());
  }
}

export default AuthService;
