"use client";
import { useState, useEffect, useCallback, startTransition } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  fetchUserStatistics,
  UserStatistic,
  aggregateStatistics,
} from "@/lib/statistics";

export function useUserStatistics() {
  const { address } = useAppKitAccount();
  const [statistics, setStatistics] = useState<UserStatistic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    if (!address) {
      setStatistics([]);
      return;
    }

    setLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const data = await fetchUserStatistics(address);
        setStatistics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load statistics"
        );
      } finally {
        setLoading(false);
      }
    });
  }, [address]);

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
