import { useState, useCallback } from 'react';
import { deepDiveApi } from '../services/api';
import type { AspectEntry } from '../types';

export function useDeepDive(
  setMatrix: React.Dispatch<React.SetStateAction<AspectEntry[] | undefined>>,
) {
  const [loadingAspect, setLoadingAspect] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const dive = useCallback(
    async (queryId: number, aspectName: string) => {
      setLoadingAspect(aspectName);
      setExpandedRows((prev) => new Set(prev).add(aspectName));

      try {
        const response = await deepDiveApi.dive({ query_id: queryId, aspect_name: aspectName });
        setMatrix((prev) => {
          if (!prev) return prev;
          return prev.map((a) =>
            a.name === aspectName ? { ...a, deepDive: response } : a,
          );
        });
      } catch {
        setExpandedRows((prev) => {
          const next = new Set(prev);
          next.delete(aspectName);
          return next;
        });
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
