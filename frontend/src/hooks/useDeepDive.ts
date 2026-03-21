import { useState, useCallback, useRef, useEffect } from 'react';
import { deepDiveApi } from '../services/api';
import type { AspectEntry, DeepDiveResponse } from '../types';

interface PendingDive {
  queryId: number;
  aspectName: string;
  promise: Promise<DeepDiveResponse>;
}

export function useDeepDive(
  setMatrix: React.Dispatch<React.SetStateAction<AspectEntry[] | undefined>>,
) {
  const [loadingAspect, setLoadingAspect] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const pendingDiveRef = useRef<PendingDive | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pendingDiveRef.current) {
        const pending = pendingDiveRef.current;

        pending.promise
          .then((response) => {
            setMatrix((prev) => {
              if (!prev) return prev;
              return prev.map((a) =>
                a.name === pending.aspectName ? { ...a, deepDive: response } : a,
              );
            });
            setLoadingAspect(null);
            pendingDiveRef.current = null;
          })
          .catch((err: unknown) => {
            if (err instanceof Error && err.name !== 'AbortError') {
              setExpandedRows((prev) => {
                const next = new Set(prev);
                next.delete(pending.aspectName);
                return next;
              });
            }
            setLoadingAspect(null);
            pendingDiveRef.current = null;
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setMatrix]);

  const dive = useCallback(
    async (queryId: number, aspectName: string): Promise<number> => {
      setLoadingAspect(aspectName);
      setExpandedRows((prev) => new Set(prev).add(aspectName));

      const divePromise = deepDiveApi.dive({ query_id: queryId, aspect_name: aspectName });
      pendingDiveRef.current = { queryId, aspectName, promise: divePromise };

      try {
        const response = await divePromise;
        setMatrix((prev) => {
          if (!prev) return prev;
          return prev.map((a) =>
            a.name === aspectName ? { ...a, deepDive: response } : a,
          );
        });
        pendingDiveRef.current = null;
        return response.cost || 0;
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setExpandedRows((prev) => {
            const next = new Set(prev);
            next.delete(aspectName);
            return next;
          });
        }
        pendingDiveRef.current = null;
        return 0;
      } finally {
        setLoadingAspect(null);
      }
    },
    [setMatrix],
  );

  const toggleRow = useCallback((aspectName: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(aspectName)) {
        next.delete(aspectName);
      } else {
        next.add(aspectName);
      }
      return next;
    });
  }, []);

  return { loadingAspect, dive, toggleRow, expandedRows };
}
