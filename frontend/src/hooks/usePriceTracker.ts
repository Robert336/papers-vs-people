import { useState, useCallback } from 'react';

export function usePriceTracker(initialCost: number = 0) {
  const [totalCost, setTotalCost] = useState(initialCost);
  const [deepDiveCount, setDeepDiveCount] = useState(0);

  const addDeepDiveCost = useCallback((cost: number) => {
    setTotalCost((prev) => Math.round((prev + cost) * 100000) / 100000);
    setDeepDiveCount((prev) => prev + 1);
  }, []);

  const reset = useCallback((newInitialCost: number = 0) => {
    setTotalCost(newInitialCost);
    setDeepDiveCount(0);
  }, []);

  return { totalCost, deepDiveCount, addDeepDiveCost, reset };
}
