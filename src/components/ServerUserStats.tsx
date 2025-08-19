import { getUserStatistics } from "@/actions/statistics";
import { aggregateStatistics } from "@/lib/statistics";

interface ServerStatsProps {
  address: string;
}

/**
 * Example Server Component that displays user statistics
 * This runs on the server and can be used in SSR/SSG scenarios
 */
export default async function ServerUserStats({ address }: ServerStatsProps) {
  try {
    const statistics = await getUserStatistics(address);
    const aggregated =
      statistics.length > 0 ? aggregateStatistics(statistics) : null;

    if (!aggregated) {
      return (
        <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6">
          <div className="text-center text-gray-400">
            No activity found for this address
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6">
        <h3 className="text-white font-semibold mb-4">
          Statistics for {address.slice(0, 6)}...{address.slice(-4)}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-gray-400 text-sm">Total Volume</div>
            <div className="text-white font-semibold">
              ${aggregated.totalVolume.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Transactions</div>
            <div className="text-white font-semibold">
              {aggregated.totalTransactions}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-white font-medium">Agent Usage</h4>
          {Object.entries(aggregated.agentUsage)
            .sort(([, a], [, b]) => b - a)
            .map(([agent, count]) => (
              <div key={agent} className="flex items-center justify-between">
                <span className="text-gray-300">{agent}</span>
                <span className="text-[#A9A0FF] font-semibold">{count}</span>
              </div>
            ))}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-[#1A1A1A] border border-red-500/20 rounded-[20px] p-6">
        <div className="text-red-400 text-center">
          Error loading statistics:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }
}
