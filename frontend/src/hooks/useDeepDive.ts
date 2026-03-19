import { useState, useCallback } from 'react';
import { deepDiveApi } from '../services/api';
import type { AspectEntry } from '../types';

export function useDeepDive(
  _matrix: AspectEntry[] | undefined,
  setMatrix: React.Dispatch<React.SetStateAction<AspectEntry[] | undefined>>,
) {
  const [loadingAspect, setLoadingAspect] = useState<string | null>(null);

  const dive = useCallback(
    async (queryId: number, aspectName: string) => {
      setLoadingAspect(aspectName);
      try {
        const response = await deepDiveApi.dive({ query_id: queryId, aspect_name: aspectName });
        setMatrix((prev) => {
          if (!prev) return prev;
          return prev.map((a) =>
            a.name === aspectName ? { ...a, deepDive: response } : a,
          );
        });
      } catch {
        // silent fail
      } finally {
        setLoadingAspect(null);
      }
    },
    [setMatrix],
  );

  const collapse = useCallback(
    (aspectName: string) => {
      setMatrix((prev) => {
        if (!prev) return prev;
        return prev.map((a) =>
          a.name === aspectName ? { ...a, deepDive: null } : a,
        );
      });
    },
    [setMatrix],
  );

  return { loadingAspect, dive, collapse };
}
