import { useCallback, useEffect, useState } from 'react';
import { historyApi } from '../services/api';
import type { SearchResponse } from '../types';

const STORAGE_KEY = 'last-state';

interface LastState {
  id: number;
  medication_name: string;
}

export function useLastState() {
  const [lastState, setLastState] = useState<LastState | null>(null);
  const [autoLoadedResult, setAutoLoadedResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LastState;
        setLastState(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const loadLastState = useCallback(async () => {
    if (!lastState) return null;
    
    setLoading(true);
    try {
      const data = await historyApi.getItem(lastState.id);
      setAutoLoadedResult(data);
      return data;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setLastState(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lastState]);

  const saveLastState = useCallback((result: SearchResponse) => {
    const newState: LastState = {
      id: result.id,
      medication_name: result.medication_name,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    setLastState(newState);
  }, []);

  const clearLastState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLastState(null);
    setAutoLoadedResult(null);
  }, []);

  return {
    lastState,
    autoLoadedResult,
    loading,
    loadLastState,
    saveLastState,
    clearLastState,
    hasLastState: !!lastState,
  };
}