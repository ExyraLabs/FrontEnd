"use client";
import Image from "next/image";
import React, { useState } from "react";
import AgentCard from "@/components/AgentCard";
import { chainImageMapping } from "@/utils/constants";

const TABS = [
  "All",
  "Execution",
  "Research",
  "Swap",
  // "Buy PT/VT",
  "Lend",
  "Bridge",
  "Provide LP",
  "Stake",
];

const CHAINS = [
  "Ethereum",
  "BNB Smart Chain",
  "Arbitrum",
  "Optimism",
  "Solana",
  "Monad",
  "Berachain",
];

// Card data
const AGENT_CARDS = [
  {
    icon: "/icons/Lido.png",
    title: "Lido Finance",
    subtitle: "Liquid staking for Ethereum",
    features: [
      "Earn staking rewards on your ETH",
      "Participate in DeFi with stETH",
    ],
    prompts: [
      // "How can I stake my ETH?",
      "How can I participate in DeFi with stETH?",
      "Stake $4 worth of ETH for me",
    ],
    chains: ["Ethereum"],
  },
  {
    icon: "/icons/uniswap.png",
    title: "Uniswap",
    subtitle: "Decentralized exchange for swapping tokens",
    features: [
      // "Swap any ERC-20 token instantly",
      "Provide liquidity and earn fees",
      "Access deep liquidity pools",
    ],
    prompts: [
      // "Swap 10 USDC to ETH",
      "Show me top pools on Uniswap",
      "Provide liquidity for ETH/USDC",
    ],
    chains: ["Ethereum", "Arbitrum", "Optimism"],
  },
  {
    icon: "/icons/kyber.png",
    title: "KyberSwap",
    subtitle: "Multi-chain DEX aggregator",
    features: [
      "Find best token swap rates across chains",
      "Swap tokens on Ethereum, BSC, Polygon, and more",
      "Earn rewards by providing liquidity",
    ],
    prompts: [
      // "Swap 5 BNB to USDT on BSC",
      "Show KyberSwap rates for ETH/USDT",
      "Provide liquidity for MATIC/USDT",
    ],
    chains: ["Ethereum", "BNB Smart Chain", "Base"],
  },
];

const Explore = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedChain, setSelectedChain] = useState("All Chains");
  const [showChainDropdown, setShowChainDropdown] = useState(false);

  // Repeat cards to fill the grid as in the screenshot
  const cards = [...AGENT_CARDS];

  return (
    <div className="flex flex-col px-4 overflow-y-scroll w-full">
      {/* Page Title */}
      <h1 className="text-[28px] font-bold text-white mb-4 mt-2">
        Explore Agents
      </h1>

      {/* Tabs and Filters Row */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 lg:gap-2 border border-[#3A3B3B] rounded-[24px] p-1 w-full md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-0 py-2 cursor-pointer rounded-[24px] text-xs lg:text-sm min-w-[75px] lg:min-w-[93px] transition-colors
                ${
                  activeTab === tab
                    ? "bg-[#3A3B3B] font-semibold text-white"
                    : "text-[#99A0AE] hover:bg-[#3A3B3B]"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex  gap-2 w-full md:flex-row md:items-center md:gap-4 md:w-auto">
          {/* Chain Dropdown */}
          <div className="relative flex flex-col items-center w-full md:w-[180px]">
            <button
              onClick={() => setShowChainDropdown((prev) => !prev)}
              className="flex items-center justify-between bg-[#262727] border border-[#3A3B3B] h-[44px] w-full text-[#F5F7F7] px-4 rounded-[40px] text-sm focus:outline-none hover:bg-[#3A3B3B] duration-300 cursor-pointer relative"
            >
              <span className="flex items-center gap-2">{selectedChain}</span>
              <Image
                src={"/icons/arrow-left.svg"}
                alt="arrow"
                className={`${
                  showChainDropdown ? "rotate-180" : ""
                } duration-300 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]`}
                width={11}
                height={11}
              />
            </button>
            {showChainDropdown && (
              <div className="absolute top-full mt-2 w-[200px] md:w-[232px] bg-[#303131] rounded-[10px] shadow-lg z-20 max-h-[320px] overflow-y-auto">
                {CHAINS.map((chain) => (
                  <div
                    key={chain}
                    className="group flex items-center gap-2 px-4 py-2 text-white text-sm cursor-pointer rounded-[14px] w-full text-left transition-colors"
                    onClick={() => {
                      setSelectedChain(chain);
                      setShowChainDropdown(false);
                    }}
                  >
                    {chainImageMapping[chain] && (
                      <Image
                        src={chainImageMapping[chain]}
                        alt={chain}
                        width={18}
                        height={18}
                      />
                    )}
                    <span className="flex-1">{chain}</span>
                    <span className="relative flex items-center">
                      <span className="w-5 h-5 rounded-[4px] border-[0.5px] border-[#343535] flex items-center justify-center bg-[#262727] group-hover:bg-[#353637] transition-colors">
                        {selectedChain === chain && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <rect
                              width="12"
                              height="12"
                              rx="3"
                              fill="#262727"
                            />
                            <path
                              d="M3 6.5L5.5 9L9 4.5"
                              stroke="#fff"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Clear Filters */}
          <button
            className={`text-xs transition-colors w-full md:w-auto text-center ${
              selectedChain === "All Chains"
                ? "text-[#3A3B3B] cursor-default"
                : "text-[#B5B5B5] hover:text-white cursor-pointer"
            }`}
            onClick={() => {
              if (selectedChain !== "All Chains")
                setSelectedChain("All Chains");
            }}
            disabled={selectedChain === "All Chains"}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <AgentCard key={idx} {...card} />
        ))}
      </div>
    </div>
  );
};

export default Explore;
