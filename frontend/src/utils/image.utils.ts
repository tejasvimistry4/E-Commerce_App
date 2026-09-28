import React from "react";
import { uploadSingleImageApi } from "../api/upload.api";
import { MESSAGES } from "../constants/messages";
import { toast } from "react-toastify";
import {
  processAndStandardizeImage,
  processMultipleImages,
  ImageProcessOptions,
} from "./imageProcessor.utils";

export { processAndStandardizeImage, processMultipleImages };
export type { ImageProcessOptions };

/**
 * Converts a database image path (e.g. /uploads/image.jpg) or full URL

 * to an absolute browser-loadable image URL without relying on Node.js process global.
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath || typeof imagePath !== "string") {
    return "";
  }

  const trimmed = imagePath.trim();

  // If already absolute HTTP(S), Blob, or Base64 Data URL, return as-is
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Safe backend base URL fallback for browser environments
  let backendBase = "http://localhost:5000";

  try {
    if (typeof process !== "undefined" && process?.env?.REACT_APP_API_URL) {
      backendBase = process.env.REACT_APP_API_URL.replace("/api", "");
    }
  } catch (_e) {
    backendBase = "http://localhost:5000";
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${backendBase}${normalizedPath}`;
};

export interface SingleImageUploadHandlers {
  onSuccess: (url: string) => void;
  setUploading?: (isUploading: boolean) => void;
  onError?: (error: any) => void;
}

/**
 * Handles HTML file input change event to upload a single image to the server with toast notifications.
 */
export const handleSingleImageFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  handlers: SingleImageUploadHandlers
): Promise<string | null> => {
  const files = event.target.files;
  if (!files || files.length === 0) return null;

  try {
    handlers.setUploading?.(true);
    const res = await uploadSingleImageApi(files[0]);
    if (res.data?.url) {
      handlers.onSuccess(res.data.url);
      toast.success(MESSAGES.MEDIA.SINGLE_UPLOAD_SUCCESS);
      return res.data.url;
    }
    return null;
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.message || MESSAGES.MEDIA.UPLOAD_FAILED;
    toast.error(errorMsg);
    handlers.onError?.(err);
    return null;
  } finally {
    handlers.setUploading?.(false);
  }
};
