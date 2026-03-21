import { useState, useCallback, useRef, useEffect } from 'react';
import { searchApi } from '../services/api';
import type { SearchResponse, SearchMode } from '../types';

export type CompareTab = 'a' | 'b';

export function useSearch() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compare mode state
  const [resultA, setResultA] = useState<SearchResponse | null>(null);
  const [resultB, setResultB] = useState<SearchResponse | null>(null);
  const [activeTab, setActiveTab] = useState<CompareTab>('a');
  const [isCompareMode, setIsCompareMode] = useState(false);

  const pendingSearchRef = useRef<{ query: string; promise: Promise<unknown> } | null>(null);

  useEffect(() => {
    const checkForCompletedSearch = () => {
      if (document.visibilityState === 'visible' && pendingSearchRef.current) {
        const pending = pendingSearchRef.current;

        Promise.race([
          pending.promise,
          new Promise<'pending'>((resolve) => setTimeout(() => resolve('pending'), 100)),
        ]).then((result) => {
          if (result !== 'pending') {
            pendingSearchRef.current = null;
          }
        });

        pending.promise
          .then((data) => {
            if (isCompareMode && data && typeof data === 'object' && 'result_a' in data) {
              const compareData = data as { result_a: SearchResponse; result_b: SearchResponse };
              setResultA(compareData.result_a);
              setResultB(compareData.result_b);
            } else if (!isCompareMode) {
              setResult(data as SearchResponse);
            }
            pendingSearchRef.current = null;
          })
          .catch((err: unknown) => {
            if (err instanceof Error && err.name !== 'AbortError') {
              const message =
                err instanceof Error ? err.message : 'Search failed. Please try again.';
              setError(message);
            }
            pendingSearchRef.current = null;
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForCompletedSearch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCompareMode]);

  const search = useCallback(async (query: string, socialPlatforms?: string[], model?: string, mode?: SearchMode) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setResultA(null);
    setResultB(null);
    setIsCompareMode(false);

    const searchPromise = searchApi.search(query, socialPlatforms, model, mode);
    pendingSearchRef.current = { query, promise: searchPromise };

    try {
      const data = await searchPromise;
      if (pendingSearchRef.current?.query === query) {
        setResult(data);
        pendingSearchRef.current = null;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Search failed. Please try again.';
      setError(message);
      pendingSearchRef.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  const compare = useCallback(
    async (query: string, socialPlatforms: string[] | undefined, modelA: string, modelB: string, mode?: SearchMode) => {
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      setResult(null);
      setResultA(null);
      setResultB(null);
      setIsCompareMode(true);
      setActiveTab('a');

      const comparePromise = searchApi.compare(query, socialPlatforms, modelA, modelB, mode);
      pendingSearchRef.current = { query, promise: comparePromise };

      try {
        const data = await comparePromise;
        if (pendingSearchRef.current?.query === query) {
          setResultA(data.result_a);
          setResultB(data.result_b);
          pendingSearchRef.current = null;
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Comparison search failed. Please try again.';
        setError(message);
        pendingSearchRef.current = null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clear = useCallback(() => {
    pendingSearchRef.current = null;
    setResult(null);
    setError(null);
    setResultA(null);
    setResultB(null);
    setIsCompareMode(false);
    setActiveTab('a');
  }, []);

  const activeResult = isCompareMode
    ? activeTab === 'a'
      ? resultA
      : resultB
    : result;

  return {
    result: activeResult,
    singleResult: result,
    resultA,
    resultB,
    activeTab,
    setActiveTab,
    isCompareMode,
    loading,
    error,
    search,
    compare,
    clear,
  };
}
