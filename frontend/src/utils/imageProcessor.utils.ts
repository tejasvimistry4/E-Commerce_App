/**
 * Product Image Processing & Standardization Utility
 * Resizes, crops, and normalizes product images to a consistent 1:1 standard aspect ratio
 * while preserving original proportions and visual quality without stretching or distortion.
 */

export interface ImageProcessOptions {
  /** Target width in pixels (Default: 1000px) */
  targetWidth?: number;
  /** Target height in pixels (Default: 1000px) */
  targetHeight?: number;
  /** Fit strategy: 'cover' (smart center crop) or 'contain' (fit with clean padding) */
  fit?: "cover" | "contain";
  /** Compression quality between 0.1 and 1.0 (Default: 0.92) */
  quality?: number;
  /** Output MIME type (Default: 'image/jpeg') */
  mimeType?: "image/jpeg" | "image/webp" | "image/png";
}

/**
 * Automatically processes, crops, and resizes a product image to standard dimensions (1000x1000 square),
 * preserving proportions and high visual quality without stretching or distortion.
 */
export const processAndStandardizeImage = async (
  file: File,
  options: ImageProcessOptions = {}
): Promise<File> => {
  const {
    targetWidth = 1000,
    targetHeight = 1000,
    fit = "cover",
    quality = 0.92,
    mimeType = "image/jpeg",
  } = options;

  // Don't process non-image files or SVG vector graphics
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const srcWidth = img.naturalWidth || img.width;
        const srcHeight = img.naturalHeight || img.height;

        if (!srcWidth || !srcHeight) {
          return resolve(file);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return resolve(file);
        }

        // High-quality bicubic smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // White background for JPEG / transparent PNG normalization
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        if (fit === "contain") {
          // Fit proportionally within square canvas with centered padding
          const scale = Math.min(targetWidth / srcWidth, targetHeight / srcHeight);
          const drawW = srcWidth * scale;
          const drawH = srcHeight * scale;
          const drawX = (targetWidth - drawW) / 2;
          const drawY = (targetHeight - drawH) / 2;

          ctx.drawImage(img, 0, 0, srcWidth, srcHeight, drawX, drawY, drawW, drawH);
        } else {
          // 'cover' - Smart non-distorting center crop preserving aspect ratio
          const srcAspect = srcWidth / srcHeight;
          const targetAspect = targetWidth / targetHeight;

          let cropX = 0;
          let cropY = 0;
          let cropW = srcWidth;
          let cropH = srcHeight;

          if (srcAspect > targetAspect) {
            // Wider than target: crop sides equally
            cropW = srcHeight * targetAspect;
            cropX = (srcWidth - cropW) / 2;
          } else if (srcAspect < targetAspect) {
            // Taller than target: crop top and bottom equally
            cropH = srcWidth / targetAspect;
            cropY = (srcHeight - cropH) / 2;
          }

          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropW,
            cropH,
            0,
            0,
            targetWidth,
            targetHeight
          );
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            const ext =
              mimeType === "image/webp"
                ? ".webp"
                : mimeType === "image/png"
                ? ".png"
                : ".jpg";
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const standardizedFileName = `${baseName}-standard${ext}`;

            const processedFile = new File([blob], standardizedFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(processedFile);
          },
          mimeType,
          quality
        );
      } catch (err) {
        console.warn("Image standardization error, falling back to original file:", err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

/**
 * Standardizes multiple image files in parallel
 */
export const processMultipleImages = async (
  files: File[],
  options?: ImageProcessOptions
): Promise<File[]> => {
  return Promise.all(files.map((file) => processAndStandardizeImage(file, options)));
};
