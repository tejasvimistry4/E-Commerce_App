import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  registerApi,
  loginApi,
  googleAuthApi,
  getMeApi,
} from "../../api/auth.api";
import {
  AuthUser,
  RegisterPayload,
  LoginPayload,
  GoogleAuthPayload,
  AuthResponse,
} from "../../types/auth";

export const registerUser = createAsyncThunk<
  AuthResponse["data"],
  RegisterPayload,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const response = await registerApi(payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      "Registration failed";
    return rejectWithValue(message);
  }
});

export const loginUser = createAsyncThunk<
  AuthResponse["data"],
  LoginPayload,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await loginApi(payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      "Login failed";
    return rejectWithValue(message);
  }
});

export const googleLoginUser = createAsyncThunk<
  AuthResponse["data"],
  GoogleAuthPayload,
  { rejectValue: string }
>("auth/googleLogin", async (payload, { rejectWithValue }) => {
  try {
    const response = await googleAuthApi(payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      "Google authentication failed";
    return rejectWithValue(message);
  }
});

export const fetchCurrentUser = createAsyncThunk<
  AuthUser,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await getMeApi();
    return response.data.user;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to fetch user profile";
    return rejectWithValue(message);
  }
});
