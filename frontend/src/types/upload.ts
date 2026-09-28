export interface UploadSingleResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    path: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
}

export interface UploadMultipleResponse {
  success: boolean;
  message: string;
  data: {
    urls: string[];
    files: Array<{
      url: string;
      path: string;
      filename: string;
      originalName: string;
      size: number;
      mimetype: string;
    }>;
  };
}
