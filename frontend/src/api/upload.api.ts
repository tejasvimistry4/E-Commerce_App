import { api } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import { UploadSingleResponse, UploadMultipleResponse } from "../types/upload";
import {
  processAndStandardizeImage,
  processMultipleImages,
  ImageProcessOptions,
} from "../utils/imageProcessor.utils";

export type { UploadSingleResponse, UploadMultipleResponse, ImageProcessOptions };

/**
 * Upload single image file to server (automatically resized/cropped to standard 1:1 aspect ratio)
 */
export const uploadSingleImageApi = async (
  file: File,
  options?: ImageProcessOptions
): Promise<UploadSingleResponse> => {
  const processedFile = await processAndStandardizeImage(file, options);
  const formData = new FormData();
  formData.append("image", processedFile);

  const response = await api.post<UploadSingleResponse>(
    API_ENDPOINTS.UPLOAD.SINGLE,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * Upload multiple image files to server (automatically resized/cropped to standard 1:1 aspect ratio)
 */
export const uploadMultipleImagesApi = async (
  files: File[],
  options?: ImageProcessOptions
): Promise<UploadMultipleResponse> => {
  const processedFiles = await processMultipleImages(files, options);
  const formData = new FormData();
  processedFiles.forEach((file) => {
    formData.append("images", file);
  });

  const response = await api.post<UploadMultipleResponse>(
    API_ENDPOINTS.UPLOAD.MULTIPLE,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

