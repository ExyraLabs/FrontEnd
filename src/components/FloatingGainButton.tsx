"use client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface GainRecommendation {
  id: string;
  token: string;
  apr: string;
  description: string;
  howToGet: string;
  rewards: string;
  protocols: Array<{ name: string; icon: string; url: string }>;
  source: { name: string; icon: string; url: string };
  timestamp: string;
}

const FloatingGainButton = () => {
  const pathname = usePathname();
  const [isChatPage, setIsChatPage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    howToGet: false,
    rewards: false,
    protocols: false,
    source: false,
  });

  // Mock data - this would come from your API
  const recommendations: GainRecommendation[] = [
    {
      id: "1",
      token: "ETH",
      apr: "8.5%",
      description:
        "Lend ETH on SummerFi for 4 - 55 organic gain plus SUMR rewards",
      howToGet:
        "Lend ETH on SummerFi ↗ lending aggregator platform to earn organic gain plus SUMR token rewards.",
      rewards: "4 - 5 organic gain plus 2 - 6% in SUMR token rewards",
      protocols: [{ name: "Pendle", icon: "/icons/star.svg", url: "#" }],
      source: { name: "X.com", icon: "/icons/x.svg", url: "#" },
      timestamp:
        "Snapshot taken on jul 21, 2025, 06:41:32. Gain and APR may have changed. Always verify before taking actions.",
    },
    {
      id: "2",
      token: "USDC",
      apr: "12.3%",
      description: "Stake USDC on Lido for high yield farming opportunities",
      howToGet:
        "Stake USDC on Lido platform to earn high APR through yield farming strategies.",
      rewards: "8 - 12% organic gain plus additional protocol rewards",
      protocols: [{ name: "Lido", icon: "/icons/star.svg", url: "#" }],
      source: { name: "X.com", icon: "/icons/x.svg", url: "#" },
      timestamp:
        "Snapshot taken on jul 21, 2025, 06:41:32. Gain and APR may have changed. Always verify before taking actions.",
    },
    {
      id: "3",
      token: "BTC",
      apr: "6.8%",
      description:
        "Provide BTC liquidity on Uniswap for trading fees and rewards",
      howToGet:
        "Provide BTC liquidity on Uniswap to earn trading fees and additional rewards.",
      rewards: "5 - 7% from trading fees plus UNI token rewards",
      protocols: [{ name: "Uniswap", icon: "/icons/star.svg", url: "#" }],
      source: { name: "X.com", icon: "/icons/x.svg", url: "#" },
      timestamp:
        "Snapshot taken on jul 21, 2025, 06:41:32. Gain and APR may have changed. Always verify before taking actions.",
    },
  ];

  useEffect(() => {
    setIsChatPage(pathname.startsWith("/chat/"));
  }, [pathname]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const currentRecommendation = recommendations[activeTab];

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        layout
        onClick={toggleModal}
        className={`flex fixed bottom-2 right-5 z-50 items-center gap-2 border-[#474848] border bg-primary justify-center hover:bg-[#A9A0FF] text-white cursor-pointer transition-all duration-500 ${
          isChatPage
            ? "w-[40px] h-[40px] rounded-full"
            : "lg:w-[251px] w-[40px] h-[40px] rounded-full lg:rounded-[24px]"
        }`}
      >
        <motion.div
          animate={{
            scale: isChatPage ? 1.1 : 1,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <Image src={"/icons/star.svg"} alt="reward" width={20} height={20} />
        </motion.div>

        <AnimatePresence mode="wait">
          {!isChatPage && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="hidden lg:flex overflow-hidden whitespace-nowrap"
            >
              Gain Recommendation
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Sliding Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={toggleModal}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 220,
              }}
              className="fixed  px-4 right-4 top-4 bottom-4 w-full max-w-sm lg:max-w-[444px] bg-[#303131] z-50 py-10 overflow-y-auto rounded-2xl border border-[#3a3a3a] shadow-lg"
            >
              {/* Close Button */}
              <button
                onClick={toggleModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Header */}
              <div className="bg-gradient-to-r w-full from-[#8A5DFF] to-[#7C4DFF] rounded-full mb-8 px-4 py-3 flex items-center gap-2 shadow-lg">
                <Image
                  src={"/icons/star.svg"}
                  alt="star"
                  width={16}
                  height={16}
                  className="text-white"
                />
                <span className="text-white font-medium text-sm">
                  Gain Recommendations
                </span>
              </div>

              {/* Tabs */}
              <div className=" mb-8 h-[40px] max-h-[40px] rounded-[12px] items-center px-1 flex border-[0.5px] border-[#D9D9D9]/40">
                {recommendations.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`flex-1 px-4 h-[32px] max-h-[32px] rounded-[8px] text-xs transition-all ${
                      activeTab === index
                        ? "bg-[#7C4DFF] text-white"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    Task {index + 1}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Token Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/icons/python.svg"
                      alt="eth"
                      width={20}
                      height={20}
                    />
                    <span className="text-white font-semibold text-xl">
                      {currentRecommendation.token}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#5EA98F] text-lg font-semibold">
                      {currentRecommendation.apr}
                    </span>
                    <span className="text-white font-semibold ml-1">APR</span>
                  </div>
                </div>

                {/* Description */}
                <div className=" p-4 rounded-[8px] border-[0.5px] border-[#d9d9d9]/40">
                  <p className="text-[#99A0AE]">
                    {currentRecommendation.description}
                  </p>
                </div>

                {/* Expandable Sections */}
                <div className="space-y-1 pb-6">
                  {/* How can I get this? */}
                  <div className="overflow-hidden">
                    <button
                      onClick={() => toggleSection("howToGet")}
                      className="w-full flex items-center justify-between py-4 text-left group"
                    >
                      <span className="text-white font-medium text-base">
                        How can I get this?
                      </span>
                      <motion.div
                        animate={{
                          rotate: expandedSections.howToGet ? -180 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-400 group-hover:text-white"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedSections.howToGet && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 pr-6">
                            <p className="text-gray-400 text-sm leading-relaxed">
                              Lend{" "}
                              <span className="font-medium text-gray-300">
                                ETH
                              </span>{" "}
                              on SummerFi{" "}
                              <a
                                href="#"
                                className="inline-flex items-center text-blue-400 hover:text-blue-300"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="ml-1"
                                >
                                  <path
                                    d="M7 17L17 7"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M7 7h10v10"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </a>{" "}
                              lending aggregator platform to earn organic gain
                              plus SUMR token rewards.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="border-b border-[#3a3a3a]"></div>
                  </div>

                  {/* Rewards */}
                  <div className="overflow-hidden">
                    <button
                      onClick={() => toggleSection("rewards")}
                      className="w-full flex items-center justify-between py-4 text-left group"
                    >
                      <span className="text-white font-medium text-base">
                        Rewards
                      </span>
                      <motion.div
                        animate={{
                          rotate: expandedSections.rewards ? -180 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-400 group-hover:text-white"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedSections.rewards && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 pr-6">
                            <p className="text-gray-400 text-sm leading-relaxed">
                              4 - 5 organic gain plus 2 - 6% in SUMR token
                              rewards
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="border-b border-[#3a3a3a]"></div>
                  </div>

                  {/* Protocols */}
                  <div className="overflow-hidden">
                    <button
                      onClick={() => toggleSection("protocols")}
                      className="w-full flex items-center justify-between py-4 text-left group"
                    >
                      <span className="text-white font-medium text-base">
                        Protocols
                      </span>
                      <motion.div
                        animate={{
                          rotate: expandedSections.protocols ? -180 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-400 group-hover:text-white"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedSections.protocols && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4">
                            <button className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] rounded-full border border-[#3a3a3a] hover:bg-[#333] transition-colors">
                              <Image
                                src="/icons/pendle.svg"
                                alt="pendle"
                                width={16}
                                height={16}
                              />
                              <span className="text-white text-sm font-medium">
                                Pendle
                              </span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className="text-gray-400"
                              >
                                <path
                                  d="M7 17L17 7"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M7 7h10v10"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="border-b border-[#3a3a3a]"></div>
                  </div>

                  {/* Source */}
                  <div className="overflow-hidden">
                    <button
                      onClick={() => toggleSection("source")}
                      className="w-full flex items-center justify-between py-4 text-left group"
                    >
                      <span className="text-white font-medium text-base">
                        Source
                      </span>
                      <motion.div
                        animate={{ rotate: expandedSections.source ? -180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-400 group-hover:text-white"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedSections.source && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 space-y-3">
                            <button className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] rounded-full border border-[#3a3a3a] hover:bg-[#333] transition-colors">
                              <Image
                                src="/icons/x.svg"
                                alt="x.com"
                                width={16}
                                height={16}
                              />
                              <span className="text-white text-sm font-medium">
                                X.com
                              </span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className="text-gray-400"
                              >
                                <path
                                  d="M7 17L17 7"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M7 7h10v10"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <p className="text-gray-500 text-xs leading-relaxed">
                              Snapshot taken on jul 21, 2025, 06:41:32. Gain and
                              APR may have changed. Always verify before taking
                              actions.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingGainButton;
