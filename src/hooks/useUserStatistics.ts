"use client";
import { useState, useEffect, useCallback, startTransition } from "react";
import {
  fetchAllStatistics,
  UserStatistic,
  aggregateStatistics,
} from "@/lib/statistics";

export function useUserStatistics() {
  const [statistics, setStatistics] = useState<UserStatistic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const data = await fetchAllStatistics();
        setStatistics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load statistics"
        );
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const aggregated =
    statistics.length > 0 ? aggregateStatistics(statistics) : null;

  return {
    statistics,
    aggregated,
    loading,
    error,
    refresh: loadStatistics,
  };
}
