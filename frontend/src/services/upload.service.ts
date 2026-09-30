import {
  uploadSingleImageApi,
  uploadMultipleImagesApi,
} from "../api/upload.api";
import {
  UploadSingleResponse,
  UploadMultipleResponse,
} from "../types/upload";

export class UploadService {
  static async uploadSingle(file: File): Promise<UploadSingleResponse> {
    return uploadSingleImageApi(file);
  }

  static async uploadMultiple(files: File[]): Promise<UploadMultipleResponse> {
    return uploadMultipleImagesApi(files);
  }
}

export default UploadService;
