import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./Icon";

export interface CarouselControlsState {
  currentIndex: number;
  totalSlides: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

export interface CarouselControlsProps {
  totalSlides: number;
  currentIndex: number;
  onSelectSlide: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
  dotClassName?: string;
  buttonClassName?: string;
}

/**
 * Reusable Carousel Navigation Controls (dots pagination + prev/next buttons).
 */
export const CarouselControls: React.FC<CarouselControlsProps> = ({
  totalSlides,
  currentIndex,
  onSelectSlide,
  onPrev,
  onNext,
  className = "mt-5 pt-3.5",
  dotClassName = "",
  buttonClassName = "",
}) => {
  if (totalSlides <= 1) return null;

  return (
    <div
      className={`border-t border-white/10 flex items-center justify-between ${className}`}
    >
      {/* Indicator Dots */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex
                ? "w-8 bg-white"
                : "w-2 bg-white/40 hover:bg-white/70"
            } ${dotClassName}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Prev / Next Arrows */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onPrev}
          className={`w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer active:scale-95 ${buttonClassName}`}
          aria-label="Previous Slide"
        >
          <Icon name="chevron-left" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className={`w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer active:scale-95 ${buttonClassName}`}
          aria-label="Next Slide"
        >
          <Icon name="chevron-right" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export interface CarouselProps<T> {
  items: T[];
  autoPlayInterval?: number;
  pauseOnHover?: boolean;
  renderItem: (item: T, index: number, controls: CarouselControlsState) => React.ReactNode;
  renderControls?: (controls: CarouselControlsState) => React.ReactNode;
  className?: string;
  showDefaultControls?: boolean;
  onSlideChange?: (index: number) => void;
}

/**
 * Generic reusable Carousel component supporting custom renderers and controls.
 */
export function Carousel<T>({
  items,
  autoPlayInterval = 6000,
  pauseOnHover = true,
  renderItem,
  renderControls,
  className = "",
  showDefaultControls = false,
  onSlideChange,
}: CarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = items.length;

  const goTo = useCallback(
    (index: number) => {
      if (totalSlides === 0) return;
      const normalizedIndex = (index + totalSlides) % totalSlides;
      setCurrentIndex(normalizedIndex);
      onSlideChange?.(normalizedIndex);
    },
    [totalSlides, onSlideChange]
  );

  const next = useCallback(() => {
    if (totalSlides <= 1) return;
    goTo(currentIndex + 1);
  }, [totalSlides, currentIndex, goTo]);

  const prev = useCallback(() => {
    if (totalSlides <= 1) return;
    goTo(currentIndex - 1);
  }, [totalSlides, currentIndex, goTo]);

  // Auto-play timer
  useEffect(() => {
    if (totalSlides <= 1 || (pauseOnHover && isPaused)) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % totalSlides;
        onSlideChange?.(nextIndex);
        return nextIndex;
      });
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [totalSlides, pauseOnHover, isPaused, autoPlayInterval, onSlideChange]);

  // Out of bounds safety guard
  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      setCurrentIndex(0);
      onSlideChange?.(0);
    }
  }, [totalSlides, currentIndex, onSlideChange]);

  if (totalSlides === 0) return null;

  const currentItem = items[currentIndex];

  const controlsState: CarouselControlsState = {
    currentIndex,
    totalSlides,
    next,
    prev,
    goTo,
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
    >
      {/* Current Slide Rendering */}
      {renderItem(currentItem, currentIndex, controlsState)}

      {/* Custom Controls (if provided) */}
      {renderControls && renderControls(controlsState)}

      {/* Default Controls (if enabled and no custom controls provided) */}
      {!renderControls && showDefaultControls && totalSlides > 1 && (
        <CarouselControls
          totalSlides={totalSlides}
          currentIndex={currentIndex}
          onSelectSlide={goTo}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}

export default Carousel;
