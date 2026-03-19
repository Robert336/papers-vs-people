import { useState, useCallback } from 'react';
import { searchApi } from '../services/api';
import type { SearchResponse } from '../types';

export function useSearch() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await searchApi.search(query);
      setResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Search failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, search, clear };
}
