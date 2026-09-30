import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { uploadSingleImageApi, uploadMultipleImagesApi } from "../../api/upload.api";
import { getImageUrl } from "../../utils/image.utils";
import { MESSAGES } from "../../constants/messages";
import { toast } from "react-toastify";

export interface ImageUploadProps {
  value?: string | string[];
  onChange: (val: any) => void;
  multiple?: boolean;
  label?: string;
  description?: string;
  maxFiles?: number;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  multiple = false,
  label = "Upload Image",
  description = "PNG, JPG, WEBP, GIF up to 10MB",
  maxFiles = 8,
  className = "",
}) => {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize single vs multiple value
  const imageList: string[] = multiple
    ? Array.isArray(value)
      ? value
      : value
      ? [value]
      : []
    : typeof value === "string" && value
    ? [value]
    : [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Validate size & types
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(MESSAGES.MEDIA.INVALID_IMAGE(file.name));
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(MESSAGES.MEDIA.FILE_TOO_LARGE(file.name));
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      if (multiple) {
        // Upload multiple files
        const res = await uploadMultipleImagesApi(validFiles);
        const newUrls = [...imageList, ...res.data.urls].slice(0, maxFiles);
        onChange(newUrls);
        toast.success(MESSAGES.MEDIA.MULTIPLE_UPLOAD_SUCCESS(res.data.urls.length));
      } else {
        // Upload single file (first valid file)
        const res = await uploadSingleImageApi(validFiles[0]);
        onChange(res.data.url);
        toast.success(MESSAGES.MEDIA.SINGLE_UPLOAD_SUCCESS);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || MESSAGES.MEDIA.UPLOAD_FAILED
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (multiple) {
      const updated = imageList.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange("");
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[11px] text-slate-400 font-normal">
            {multiple ? `${imageList.length}/${maxFiles} uploaded` : description}
          </span>
        </div>
      )}

      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
        multiple={multiple}
        className="hidden"
      />

      {/* Single Mode Upload & Preview */}
      {!multiple && (
        <>
          {imageList.length > 0 ? (
            <div className="relative rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between group">
              <div className="flex items-center space-x-3.5 overflow-hidden">
                <div className="w-16 h-16 aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={getImageUrl(imageList[0])}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {imageList[0].split("/").pop() || "image"}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1 mt-0.5">
                    <span>✓ Uploaded to server</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(0)}
                  disabled={uploading}
                  className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-purple-600 bg-purple-50/60 scale-[1.01]"
                  : "border-slate-300 hover:border-purple-500 bg-slate-50/60 hover:bg-white"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <div className="w-8 h-8 rounded-full border-3 border-purple-600/20 border-t-purple-600 animate-spin" />
                  <p className="text-xs font-bold text-purple-700">Uploading image to server...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      <span className="text-purple-700">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Multiple Mode Upload & Gallery Grid */}
      {multiple && (
        <div className="space-y-3">
          {/* Gallery Previews */}
          {imageList.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {imageList.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden shadow-2xs"
                >
                  <img
                    src={getImageUrl(url)}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                    title="Remove this image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-600 text-white shadow-xs">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Drop Zone if under maxFiles */}
          {imageList.length < maxFiles && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-purple-600 bg-purple-50/60 scale-[1.01]"
                  : "border-slate-300 hover:border-purple-500 bg-slate-50/60 hover:bg-white"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-1">
                  <div className="w-7 h-7 rounded-full border-3 border-purple-600/20 border-t-purple-600 animate-spin" />
                  <p className="text-xs font-bold text-purple-700">Uploading gallery photos...</p>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      <span className="text-purple-700">Add gallery images</span> or drag files here
                    </p>
                    <p className="text-[10px] text-slate-400">Select multiple files up to {maxFiles} total</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
