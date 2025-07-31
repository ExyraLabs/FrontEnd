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
  "Buy PT/VT",
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

const TIERS = [
  {
    name: "Bronze",
    url: "/icons/bronze.svg",
  },
  {
    name: "Silver",
    url: "/icons/silver.svg",
  },
  {
    name: "Gold",
    url: "/icons/gold.svg",
  },
];

const CATEGORIES = ["Agent", "Chain", "Others"];

const AgentBadges = [
  "Shadow Badge",
  "Dolomite Badge",
  "BEX Badge",
  "Beets Badge",
  "Kodak Badge",
  "Silo Badge",
  "INT Badge",
  "Infared Badge",
];

const ChainBadges = ["BSC Badge", "Sonic Badge", "Mantle Badge", "Base Badge"];
const OtherBadges = ["Referall Badge", "Insights Badge"];
const Explore = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All Tiers");
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  return (
    <div className="flex  flex-col lg:flex-row flex-1 gap-8 px-4 overflow-y-scroll w-full">
      <div className="lg:w-[60%]">
        <div className="flex justify-between mb-4 mt-2 items-center">
          {/* Page Title */}
          <h1 className=" text-[24px] lg:text-[28px] font-bold text-white">
            Rewards
          </h1>
          <p className="text-sm bg-[#262727] rounded-[17px] text-primary px-6 py-2.5 ">
            Reward System
          </p>
        </div>
        <p className="text-[#eee6e6] my-6">
          Badge holders will share a reward pool of 4 billion Exyra Stones.
          Stones signify your stake and rewards contribution to powering DeFi
          with AI through EXYRA.
        </p>
        {/* Filters */}
        <div className="flex items-center">
          <div className="relative  flex flex-col items-center w-full md:w-[180px]">
            <button
              onClick={() => {
                setShowTierDropdown((prev) => !prev);
                if (showCategoryDropdown) {
                  setShowCategoryDropdown(false);
                }
              }}
              className="flex items-center justify-between bg-[#262727] border border-[#3A3B3B] h-[44px] w-full text-[#F5F7F7] px-4 rounded-[40px] text-sm focus:outline-none hover:bg-[#3A3B3B] duration-300 cursor-pointer relative"
            >
              <span className="flex  text-[10px] lg:text-sm items-center gap-2">
                {selectedTier}
              </span>
              <Image
                src={"/icons/arrow-left.svg"}
                alt="arrow"
                className={`${
                  showTierDropdown ? "rotate-180" : ""
                } duration-300 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]`}
                width={11}
                height={11}
              />
            </button>
            {showTierDropdown && (
              <div className="absolute left-0  top-full mt-2 w-[200px] md:w-[232px] bg-[#303131] rounded-[10px] p-5 shadow-lg z-50  max-h-[320px] overflow-y-auto">
                {TIERS.map((tier) => (
                  <div
                    key={tier.name}
                    className="group flex items-center gap-2 px-4 py-2 text-white text-sm cursor-pointer rounded-[14px] w-full text-left transition-colors"
                    onClick={() => {
                      setSelectedTier(tier.name);
                      setShowTierDropdown(false);
                    }}
                  >
                    <Image
                      src={tier.url}
                      alt={tier.name}
                      width={18}
                      height={18}
                    />
                    <span className="flex-1">{tier.name}</span>
                    <span className="relative flex items-center">
                      <span className="w-5 h-5 rounded-[4px] border-[0.5px] border-[#343535] flex items-center justify-center bg-[#262727] group-hover:bg-[#353637] transition-colors">
                        {selectedTier === tier.name && (
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
          <div className="relative ml-4  flex flex-col items-center w-full md:w-[180px]">
            <button
              onClick={() => {
                setShowCategoryDropdown((prev) => !prev);
                if (showTierDropdown) {
                  setShowTierDropdown(false);
                }
              }}
              className="flex items-center justify-between bg-[#262727] border border-[#3A3B3B] h-[44px] w-full text-[#F5F7F7] px-4 rounded-[40px] text-sm focus:outline-none hover:bg-[#3A3B3B] duration-300 cursor-pointer relative"
            >
              <span className="flex text-[10px] lg:text-sm items-center gap-2">
                {selectedCategory}
              </span>
              <Image
                src={"/icons/arrow-left.svg"}
                alt="arrow"
                className={`${
                  showCategoryDropdown ? "rotate-180" : ""
                } duration-300 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]`}
                width={11}
                height={11}
              />
            </button>
            {showCategoryDropdown && (
              <div className="absolute left-0  top-full mt-2 w-[200px] md:w-[232px] bg-[#303131] rounded-[10px] p-5 shadow-lg z-50  max-h-[320px] overflow-y-auto">
                {CATEGORIES.map((category) => (
                  <div
                    key={category}
                    className="group flex items-center gap-2 px-4 py-2 text-white text-sm cursor-pointer rounded-[14px] w-full text-left transition-colors"
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <span className="flex-1">{category}</span>
                    <span className="relative flex items-center">
                      <span className="w-5 h-5 rounded-[4px] border-[0.5px] border-[#343535] flex items-center justify-center bg-[#262727] group-hover:bg-[#353637] transition-colors">
                        {selectedCategory === category && (
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
          <button
            className={`text-xs ml-auto transition-colors w-full md:w-auto text-center ${
              selectedTier === "All Tiers" &&
              selectedCategory === "All Categories"
                ? "text-[#3A3B3B] cursor-default"
                : "text-[#B5B5B5] hover:text-white cursor-pointer"
            }`}
            onClick={() => {
              if (selectedTier !== "All Tiers") {
                setSelectedTier("All Tiers");
              }
              if (selectedCategory !== "All Categories") {
                setSelectedCategory("All Categories");
              }
            }}
            disabled={
              selectedTier === "All Tiers" &&
              selectedCategory === "All Categories"
            }
          >
            Clear Filters
          </button>
        </div>
        <div>
          <h5 className="font-semibold mt-4 text-[#F5F7F7]">
            Agents: <span className="text-primary font-medium">0 </span>{" "}
            <span className="text-[#99A0AE] font-medium">
              /{AgentBadges.length}
            </span>
            <div className="flex flex-wrap gap-4">
              {AgentBadges.map((badge, index) => {
                return (
                  <div
                    key={badge}
                    className="w-[152px] lg:w-[140px] flex items-center justify-center relative h-[143px] rounded-2xl bg-[#262727] mt-2"
                  >
                    <Image
                      src={"/icons/lock.svg"}
                      width={20}
                      height={20}
                      alt="lock"
                      className="absolute top-2.5 right-[15px]"
                    />
                    <div className="relative w-[94.15px] h-[101.78px]">
                      <Image
                        fill
                        src={
                          index % 2 === 0
                            ? "/images/panda.png"
                            : "/images/ring.png"
                        }
                        alt={badge}
                      />
                    </div>
                    <p className="absolute text-xs text-[#F5F7F7] mx-auto bottom-2">
                      {badge}
                    </p>
                  </div>
                );
              })}
            </div>
          </h5>
        </div>
        <div>
          <h5 className="font-semibold mt-4 text-[#F5F7F7]">
            Chains: <span className="text-primary font-medium">0 </span>{" "}
            <span className="text-[#99A0AE] font-medium">
              /{ChainBadges.length}
            </span>
            <div className="flex flex-wrap gap-4">
              {ChainBadges.map((badge, index) => {
                return (
                  <div
                    key={badge}
                    className="w-[152px] lg:w-[140px] flex items-center justify-center relative h-[143px] rounded-2xl bg-[#262727] mt-2"
                  >
                    <Image
                      src={"/icons/lock.svg"}
                      width={20}
                      height={20}
                      alt="lock"
                      className="absolute top-2.5 right-[15px]"
                    />
                    <div className="relative w-[94.15px] h-[101.78px]">
                      <Image
                        fill
                        src={
                          index % 2 === 0
                            ? "/images/panda.png"
                            : "/images/ring.png"
                        }
                        alt={badge}
                      />
                    </div>
                    <p className="absolute text-xs text-[#F5F7F7] mx-auto bottom-2">
                      {badge}
                    </p>
                  </div>
                );
              })}
            </div>
          </h5>
        </div>
        <div>
          <h5 className="font-semibold mt-4 text-[#F5F7F7]">
            Others: <span className="text-primary font-medium">0 </span>{" "}
            <span className="text-[#99A0AE] font-medium">
              /{OtherBadges.length}
            </span>
            <div className="flex flex-wrap gap-4">
              {OtherBadges.map((badge, index) => {
                return (
                  <div
                    key={badge}
                    className="w-[152px] lg:w-[140px] flex items-center justify-center relative h-[143px] rounded-2xl bg-[#262727] mt-2"
                  >
                    <Image
                      src={"/icons/lock.svg"}
                      width={20}
                      height={20}
                      alt="lock"
                      className="absolute top-2.5 right-[15px]"
                    />
                    <div className="relative w-[94.15px] h-[101.78px]">
                      <Image
                        fill
                        src={
                          index % 2 === 0
                            ? "/images/panda.png"
                            : "/images/ring.png"
                        }
                        alt={badge}
                      />
                    </div>
                    <p className="absolute text-xs text-[#F5F7F7] mx-auto bottom-2">
                      {badge}
                    </p>
                  </div>
                );
              })}
            </div>
          </h5>
        </div>
      </div>
      <div className="flex-1 bg-[#303131] flex flex-col justify-center items-center rounded-[20px] h-[596px]">
        <div className="w-[173px] h-[173px] relative">
          <Image src={"/images/illustration.svg"} fill alt="ill" />
        </div>
        <h5 className="font-bold mt-4 text-[#F5F7F7]">
          Select a Badge to view details.
        </h5>
        <p className="text-[#EEE6E6] max-w-[341px] text-sm text-center mt-2">
          Learn how to earn each badge, unlock higher tiers and increase your
          reward
        </p>
      </div>
    </div>
  );
};

export default Explore;
