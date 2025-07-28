import Image from "next/image";
import React from "react";

const examples = [
  "How can I get started?",
  "Tell me more about DeFi",
  "How can I earn rewards?",
];

const DefiOptions = [
  {
    title: "Swap",
    icon: "icons/swap.svg",
  },
  {
    title: "Buy",
    icon: "icons/buy.svg",
  },
  {
    title: "Lend",
    icon: "icons/lend.svg",
  },
  {
    title: "Bridge",
    icon: "icons/bridge.svg",
  },
  {
    title: "Stake",
    icon: "icons/stake.svg",
  },
  {
    title: "Provide LP",
    icon: "icons/lp.svg",
  },
];
const ChatSection = () => {
  const [showDefiOptions, setShowDefiOptions] = React.useState(false);
  return (
    <div className=" flex-1  relative flex flex-col">
      <div className=" flex flex-col justify-center   flex-1">
        <div className="flex items-center justify-center lg:justify-start  gap-[9px] ">
          <Image src={"/icons/hello.svg"} alt="hello" width={33} height={31} />
          <h5 className="bg-gradient-to-r from-[#F85E2E] via-[#FB9B7E]/90 to-[#FF5F2E]  text-transparent bg-clip-text text-[22px] lg:text-[32px] font-medium">
            Hello, how can I help?
          </h5>
        </div>
        <div className="flex   mt-[50px] flex-col">
          <div className=" flex lg:justify-start gap-x-2 gap-y-4  justify-center  flex-wrap ">
            {examples.map((example, index) => (
              <button
                key={index}
                className="bg-[#303131] min-w-max rounded-[14px] text-white px-2.5 lg:px-4 h-[31px] text-[12px] lg:text-xs font-medium lg:mr-2 mb-2 hover:bg-[#d94d32]/70 transition-colors cursor-pointer"
                onClick={() => {
                  // Handle example click
                  console.log(`Example clicked: ${example}`);
                }}
              >
                {example}
              </button>
            ))}
          </div>
          <div className="bg-[#303131] mt-[56px] lg:mt-[32px] w-full lg:w-[90%] rounded-[24px] p-5">
            <textarea
              className="w-full min-h-[80px] bg-transparent text-white placeholder:text-[#DAD0D0] font-medium border-none focus:outline-none resize-none"
              placeholder="Ask anything ..."
            ></textarea>
            <div className=" flex justify-between items-center  ">
              <div className="h-[41px] flex items-center gap-3 ">
                <button className="flex items-center lg:gap-2 border-[#474848] border bg-[#282A2E] w-[48px] h-[48px] lg:h-full  lg:px-5 lg:w-[123px] rounded-full justify-center hover:bg-[#d94d32] text-white cursor-pointer lg:rounded-[24px] transition-colors">
                  <Image
                    src={"/icons/rewards-white.svg"}
                    alt="reward"
                    width={18}
                    className=""
                    height={18}
                  />
                  <span className="text-sm hidden lg:flex">Rewards</span>
                </button>
                <button
                  onClick={() => setShowDefiOptions(!showDefiOptions)}
                  className={`flex items-center gap-2 border-[#474848] border bg-[#282A2E] h-full lg:px-5 w-[65px] lg:w-[197px] justify-center relative hover:border-primary text-white cursor-pointer rounded-[24px] ${
                    showDefiOptions ? "border-primary" : " "
                  }`}
                >
                  {showDefiOptions && (
                    <div
                      className={`absolute ${
                        showDefiOptions ? "opacity-100" : "opacity-0"
                      } duration-300 transition-all -top-1 -translate-y-full left-0 w-full px-[5px] py-[9px] flex flex-col gap-2  bg-[#282A2E] rounded-lg z-10`}
                    >
                      {DefiOptions.map((option) => (
                        <div
                          key={option.title}
                          className="flex items-center gap-2 px-4 py-2 text-white  text-xs cursor-pointer hover:bg-[#1E1F1F] rounded-[14px] w-full text-left transition-colors"
                        >
                          <Image
                            src={option.icon}
                            alt={option.title}
                            width={16}
                            height={16}
                          />
                          {option.title}
                        </div>
                      ))}
                    </div>
                  )}
                  <Image
                    src={
                      showDefiOptions ? "icons/defi-2.svg" : "/icons/defi.svg"
                    }
                    alt="reward"
                    width={18}
                    height={18}
                  />
                  <span className="text-sm hidden lg:flex">Defi Execution</span>
                  {/* Dropdown Arrow */}
                  <Image
                    src={"/icons/arrow-left.svg"}
                    alt="arrow"
                    className={`${
                      showDefiOptions ? "rotate-180" : ""
                    } duration-300`}
                    width={11}
                    height={11}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 relative">
                {/* Message Counter and Tooltip */}
                <div className="flex items-center gap-1 relative">
                  <span className="text-[#888888] text-[8px] lg:text-xs font-medium select-none">
                    29 / 30 messages
                  </span>
                  <div className="relative  flex items-center group">
                    <button
                      className="focus:outline-none"
                      tabIndex={0}
                      aria-label="Message limit info"
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                      }}
                    >
                      <div className="relative w-[12px] lg:w-[14px] h-[12px] lg:h-[14px]">
                        <Image src={"/icons/help.svg"} fill alt="info" />
                      </div>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-[120%] right-1/2  translate-x-1/2 z-20 hidden group-hover:flex group-focus-within:flex flex-col items-center">
                      <div className="bg-[#282A2E]  -translate-x-[30%] text-[#d9d9d9] text-sm rounded-[12px] px-8 py-6 shadow-lg w-[342px] text-center font-medium whitespace-pre-line">
                        Daily message limit: 30 messages per wallet.Resets daily
                        at midnight UTC
                      </div>
                      {/* Tooltip pointer */}
                      <svg
                        width="32"
                        height="16"
                        viewBox="0 0 32 16"
                        className="-mt-1"
                        style={{ display: "block" }}
                      >
                        <polygon points="16,16 0,0 32,0" fill="#282A2E" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-[#F39C82] w-[32px] h-[32px] lg:w-[42px] lg:h-[42px] rounded-full flex justify-center items-center">
                  <div className="relative w-[22px] lg:w-[24px] h-[22px] lg:h-[24px]">
                    <Image
                      src={"/icons/arrow-right.svg"}
                      alt="arrow"
                      width={24}
                      height={24}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button className="flex absolute bottom-5 right-5  items-center gap-2 border-[#474848] border bg-primary lg:w-[251px] w-[40px] h-[40px] justify-center hover:bg-[#d94d32] text-white cursor-pointer rounded-full lg:rounded-[24px] transition-colors">
        <Image src={"/icons/star.svg"} alt="reward" width={20} height={20} />
        <span className="hidden lg:flex">Gain Recommendation</span>
      </button>
    </div>
  );
};

export default ChatSection;
