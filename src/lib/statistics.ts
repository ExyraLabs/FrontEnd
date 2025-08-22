import { getUserStatistics, getAllStatistics } from "@/actions/statistics";

/**
 * Fetch user statistics using server action
 */
export async function fetchUserStatistics(address: string) {
  try {
    const statistics = await getUserStatistics(address);
    return statistics;
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    throw error;
  }
}

/**
 * Fetch all users' statistics using server action
 */
export async function fetchAllStatistics() {
  try {
    const statistics = await getAllStatistics();
    return statistics;
  } catch (error) {
    console.error("Error fetching all statistics:", error);
    throw error;
  }
}

/**
 * Statistics data interface
 */
export interface UserStatistic {
  _id: string;
  address: string;
  agent: string;
  action: string;
  volume: number;
  token: string;
  volumeUsd?: number | null;
  extra?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Get aggregated statistics for a user
 */
export function aggregateStatistics(statistics: UserStatistic[]) {
  const totalVolume = statistics.reduce(
    (sum, stat) => sum + (stat.volumeUsd || 0),
    0
  );
  const totalTransactions = statistics.length;

  const agentUsage = statistics.reduce((acc, stat) => {
    acc[stat.agent] = (acc[stat.agent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const actionBreakdown = statistics.reduce((acc, stat) => {
    acc[stat.action] = (acc[stat.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tokenBreakdown = statistics.reduce((acc, stat) => {
    acc[stat.token] = (acc[stat.token] || 0) + stat.volume;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalVolume,
    totalTransactions,
    agentUsage,
    actionBreakdown,
    tokenBreakdown,
    mostUsedAgent: Object.entries(agentUsage).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0],
    mostUsedAction: Object.entries(actionBreakdown).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0],
  };
}
