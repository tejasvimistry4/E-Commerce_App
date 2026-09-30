import React, { useState, useRef, useCallback, useEffect } from "react";
import { getImageUrl } from "../../utils/image.utils";

export interface ProductImageZoomProps {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  zoomScale?: number;
  enlargedWidth?: number;
  enlargedHeight?: number;
  enlargedPosition?: "beside" | "over" | "auto";
  lensStyle?: React.CSSProperties;
  enlargedContainerStyle?: React.CSSProperties;
}

export const ProductImageZoom: React.FC<ProductImageZoomProps> = ({
  src,
  alt = "Product Image",
  className = "w-full h-full flex items-center justify-center",
  imageClassName = "w-full h-full object-contain",
  zoomScale = 2.5,
  enlargedWidth = 560,
  enlargedHeight = 560,
  enlargedPosition = "beside",
  lensStyle,
  enlargedContainerStyle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [lensState, setLensState] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>({ x: 0, y: 0, w: 0, h: 0 });

  const [zoomState, setZoomState] = useState<{
    translateX: number;
    translateY: number;
    largeW: number;
    largeH: number;
  }>({ translateX: 0, translateY: 0, largeW: 0, largeH: 0 });

  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  const fullImageUrl = getImageUrl(src);

  // Reset zoom state whenever the active image source changes (e.g. variant change or thumbnail click)
  useEffect(() => {
    setIsActive(false);
  }, [src]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isBeside =
    enlargedPosition === "beside" || (enlargedPosition === "auto" && isDesktop);

  const updateZoomPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!imgRef.current) return;

      const rect = imgRef.current.getBoundingClientRect();

      // Pointer position relative to the image
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Deactivate if out of image bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        setIsActive(false);
        return;
      }

      // Preview dimensions
      const previewW = isBeside ? enlargedWidth : rect.width;
      const previewH = isBeside ? enlargedHeight : rect.height;

      // Lens size on small base image
      const lensW = Math.max(40, Math.min(rect.width * 0.9, rect.width / zoomScale));
      const lensH = Math.max(40, Math.min(rect.height * 0.9, rect.height / zoomScale));

      // Center lens on cursor and clamp within image boundaries
      const lensX = Math.max(0, Math.min(x - lensW / 2, rect.width - lensW));
      const lensY = Math.max(0, Math.min(y - lensH / 2, rect.height - lensH));

      // Scaling factors to match lens area to preview window
      const scaleX = previewW / lensW;
      const scaleY = previewH / lensH;

      const largeW = rect.width * scaleX;
      const largeH = rect.height * scaleY;
      const translateX = -lensX * scaleX;
      const translateY = -lensY * scaleY;

      setLensState({
        x: lensX,
        y: lensY,
        w: lensW,
        h: lensH,
      });

      setZoomState({
        translateX,
        translateY,
        largeW,
        largeH,
      });

      setIsActive(true);
    },
    [zoomScale, enlargedWidth, enlargedHeight, isBeside]
  );

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    updateZoomPosition(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateZoomPosition(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    setIsActive(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      updateZoomPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      updateZoomPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsActive(false);
  };

  if (!fullImageUrl) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ cursor: "crosshair", touchAction: "none" }}
    >
      {/* Base Small Image */}
      <img
        ref={imgRef}
        src={fullImageUrl}
        alt={alt}
        className={imageClassName}
        draggable={false}
      />

      {/* Tinted Lens Box on Base Image */}
      {isActive && (
        <div
          className="absolute pointer-events-none rounded-2xl transition-opacity duration-150"
          style={{
            left: `${lensState.x}px`,
            top: `${lensState.y}px`,
            width: `${lensState.w}px`,
            height: `${lensState.h}px`,
            backgroundColor: "rgba(99, 102, 241, 0.20)",
            border: "2px solid rgba(99, 102, 241, 0.80)",
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.40)",
            backdropFilter: "blur(0.5px)",
            ...lensStyle,
          }}
        />
      )}

      {/* Large Magnified Preview Window */}
      <div
        className={`absolute overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-2xl transition-all duration-150 pointer-events-none ${
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          zIndex: 50,
          top: 0,
          left: isBeside ? "calc(100% + 20px)" : 0,
          width: isBeside ? `${enlargedWidth}px` : "100%",
          height: isBeside ? `${enlargedHeight}px` : "100%",
          visibility: isActive ? "visible" : "hidden",
          backgroundColor: "#ffffff",
          ...enlargedContainerStyle,
        }}
      >
        <img
          src={fullImageUrl}
          alt={`${alt} - Magnified Detail`}
          className="absolute pointer-events-none will-change-transform !max-w-none !max-h-none"
          style={{
            width: `${zoomState.largeW}px`,
            height: `${zoomState.largeH}px`,
            transform: `translate3d(${zoomState.translateX}px, ${zoomState.translateY}px, 0)`,
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ProductImageZoom;
