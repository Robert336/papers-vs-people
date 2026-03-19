import { useState, useCallback } from 'react';
import { historyApi } from '../services/api';
import type { HistoryItem, SearchResponse } from '../types';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await historyApi.getHistory();
      setHistory(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(
    async (id: number) => {
      await historyApi.deleteItem(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    },
    [],
  );

  const loadItem = useCallback(async (id: number): Promise<SearchResponse> => {
    return historyApi.getItem(id);
  }, []);

  return { history, loading, fetchHistory, deleteItem, loadItem };
}
