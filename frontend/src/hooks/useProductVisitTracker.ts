import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "./redux";
import { trackProductVisitApi, getProductVisitStatusApi } from "../api/visit.api";
import { ProductVisitStats } from "../types/visit";

export function useProductVisitTracker(productId?: string) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [visitStats, setVisitStats] = useState<ProductVisitStats | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track the currently processed product to avoid redundant executions during React re-renders
  const lastTrackedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productId || !isAuthenticated || !user?.id) {
      setVisitStats(null);
      return;
    }

    // Skip if already tracked this productId in current mount cycle
    if (lastTrackedProductIdRef.current === productId) {
      return;
    }

    let isMounted = true;
    lastTrackedProductIdRef.current = productId;

    const recordVisit = async () => {
      setIsTracking(true);
      setError(null);

      try {
        // Send tracking request to backend
        const response = await trackProductVisitApi(productId);

        if (isMounted && response.success) {
          setVisitStats({
            hasVisited: true,
            visitCount: response.visitCount,
            isHighlyInterested: response.isHighlyInterested,
            firstVisitedAt: response.firstVisitedAt || null,
            lastVisitedAt: response.lastVisitedAt || null,
            threshold: response.threshold || 3,
          });
        }
      } catch (err: any) {
        // Fallback: If tracking endpoint threw non-fatal error, attempt read-only status query
        try {
          const status = await getProductVisitStatusApi(productId);
          if (isMounted && status.success) {
            setVisitStats(status);
          }
        } catch (fallbackErr) {
          if (isMounted) {
            setError("Could not track visit.");
          }
        }
      } finally {
        if (isMounted) {
          setIsTracking(false);
        }
      }
    };

    recordVisit();

    return () => {
      isMounted = false;
    };
  }, [productId, isAuthenticated, user?.id]);

  return {
    visitStats,
    isTracking,
    isHighlyInterested: Boolean(visitStats?.isHighlyInterested),
    visitCount: visitStats?.visitCount || 0,
    threshold: visitStats?.threshold || 3,
    error,
  };
}
