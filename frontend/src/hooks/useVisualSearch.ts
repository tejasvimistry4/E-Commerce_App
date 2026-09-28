import { useState, useCallback } from "react";
import ProductService from "../services/product.service";
import { VisualSearchResult, VisualSearchOptions } from "../types/visualSearch";

export interface UseVisualSearchReturn {
  isSearching: boolean;
  results: VisualSearchResult[];
  error: string | null;
  selectedImage: File | null;
  previewUrl: string | null;
  threshold: number;
  setThreshold: (threshold: number) => void;
  searchByImage: (file: File, options?: VisualSearchOptions) => Promise<VisualSearchResult[]>;
  clearSearch: () => void;
}

export const useVisualSearch = (defaultThreshold = 0.90): UseVisualSearchReturn => {
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<VisualSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(defaultThreshold);

  const clearSearch = useCallback(() => {
    setIsSearching(false);
    setResults([]);
    setError(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const searchByImage = useCallback(
    async (file: File, options?: VisualSearchOptions): Promise<VisualSearchResult[]> => {
      setIsSearching(true);
      setError(null);
      setSelectedImage(file);

      // Create preview object URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        const response = await ProductService.searchByImage(file, {
          threshold,
          ...options,
        });

        const data = response.data || [];
        setResults(data);
        return data;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Failed to perform visual search.";
        setError(msg);
        setResults([]);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [threshold]
  );

  return {
    isSearching,
    results,
    error,
    selectedImage,
    previewUrl,
    threshold,
    setThreshold,
    searchByImage,
    clearSearch,
  };
};

export default useVisualSearch;
