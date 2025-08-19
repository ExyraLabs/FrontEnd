"use client";
import { useUserStatistics } from "@/hooks/useUserStatistics";
import { useAppKitAccount } from "@reown/appkit/react";

export default function UserStatsDemo() {
  const { isConnected } = useAppKitAccount();
  const { statistics, aggregated, loading, error, refresh } =
    useUserStatistics();

  if (!isConnected) {
    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6">
        <div className="text-center text-gray-400">
          Connect your wallet to view statistics
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6">
        <div className="flex items-center justify-center gap-3 text-[#A9A0FF]">
          <div className="w-4 h-4 border-2 border-[#A9A0FF] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1A1A1A] border border-red-500/20 rounded-[20px] p-6">
        <div className="text-red-400 text-center mb-4">
          Error loading statistics: {error}
        </div>
        <button
          onClick={refresh}
          className="w-full bg-[#A9A0FF] text-white py-2 rounded-lg hover:bg-[#9A8FFF]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Your DeFi Activity</h3>
          <button
            onClick={refresh}
            className="text-[#A9A0FF] hover:text-white text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {aggregated ? (
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <div className="text-gray-400 text-sm">Most Used Agent</div>
              <div className="text-white font-semibold">
                {aggregated.mostUsedAgent || "None"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Most Used Action</div>
              <div className="text-white font-semibold">
                {aggregated.mostUsedAction || "None"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No activity yet. Start using DeFi agents to see your statistics!
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {statistics.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6">
          <h4 className="text-white font-semibold mb-4">Recent Activity</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {statistics.slice(0, 10).map((stat) => (
              <div
                key={stat._id}
                className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#A9A0FF]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#A9A0FF] text-xs">
                      {stat.agent.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">
                      {stat.action} on {stat.agent}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {stat.volume} {stat.token}
                      {stat.volumeUsd && ` (~$${stat.volumeUsd.toFixed(2)})`}
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 text-xs text-right">
                  {new Date(stat.timestamp).toLocaleDateString()}
                  <br />
                  {new Date(stat.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Usage Breakdown */}
      {aggregated && Object.keys(aggregated.agentUsage).length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6">
          <h4 className="text-white font-semibold mb-4">Agent Usage</h4>
          <div className="space-y-2">
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
      )}
    </div>
  );
}
