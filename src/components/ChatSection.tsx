import { MessageRole, TextMessage } from "@copilotkit/runtime-client-gql";
import { useAppKitAccount } from "@reown/appkit/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChatRoomsMessages } from "../hooks/useChatRoomsMessages";
import ConnectWalletModal from "./ConnectWalletModal";

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
  const [showDefiOptions, setShowDefiOptions] = useState(false);
  const { address } = useAppKitAccount();
  const [showModal, setShowModal] = useState(false);

  const { createChatRoom, loadChatRooms } = useChatRoomsMessages();
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  // Helper to generate a proper uuid (RFC4122 v4)
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  const handleSendMessage = () => {
    const prompt = inputValue.trim();
    if (!prompt) return;
    let chatId = generateUUID();
    const chatRooms = loadChatRooms();
    // Ensure unique chatId
    while (chatRooms[chatId]) {
      chatId = generateUUID();
    }
    // Create message object using TextMessage constructor
    const message = new TextMessage({
      id: generateUUID(),
      role: MessageRole.User,
      content: prompt,
      createdAt: new Date().toISOString(),
    });

    // Create chat room - title will be auto-generated from message content
    createChatRoom(chatId, "", message);

    setInputValue("");
    // Switch route to /chat/[id]
    router.push(`/chat/${chatId}`);
  };
  return (
    <div className=" flex-1 px-4  relative flex flex-col">
      <ConnectWalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <div className=" flex flex-col justify-center   flex-1">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex text-primary items-center justify-center lg:justify-start  gap-[9px] "
        >
          <motion.svg
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            width="33"
            height="32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter="url(#prefix__filter0_d_3300_1965)">
              <path
                d="M25 11.991c-4.693 0-8.491 3.816-8.491 8.509 0-4.693-3.816-8.509-8.509-8.509 4.693 0 8.509-3.798 8.509-8.491A8.486 8.486 0 0025 11.991z"
                fill="currentColor"
              />
              <path
                d="M25 11.991c-4.693 0-8.491 3.816-8.491 8.509 0-4.693-3.816-8.509-8.509-8.509 4.693 0 8.509-3.798 8.509-8.491A8.486 8.486 0 0025 11.991z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <rect
              x="14"
              y="24.5"
              width="6"
              height="6"
              rx="3"
              fill="currentColor"
            />
            <defs>
              <filter
                id="prefix__filter0_d_3300_1965"
                x="3.5"
                y="3"
                width="26"
                height="26"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="4" />
                <feGaussianBlur stdDeviation="2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                <feBlend
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_3300_1965"
                />
                <feBlend
                  in="SourceGraphic"
                  in2="effect1_dropShadow_3300_1965"
                  result="shape"
                />
              </filter>
            </defs>
          </motion.svg>
          <motion.h5
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="bg-gradient-to-r from-[#4F3CFF] via-[#7EA1FB]/90 to-primary  text-transparent bg-clip-text text-[22px] lg:text-[32px] font-medium"
          >
            Hello, how can I help?
          </motion.h5>
        </motion.div>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
          className="flex   mt-[50px] flex-col"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }}
            className=" flex  lg:justify-start gap-x-2 gap-y-2  justify-center  flex-wrap "
          >
            {examples.map((example, index) => (
              <motion.button
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.8 + index * 0.1,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#303131] min-w-max rounded-[14px] text-white px-2.5 lg:px-4 h-[31px] text-[12px] lg:text-xs font-medium lg:mr-2 mb-2 hover:bg-primary/70 duration-500 transition-colors cursor-pointer"
                onClick={() => {
                  // Handle example click
                  console.log(`Example clicked: ${example}`);
                }}
              >
                {example}
              </motion.button>
            ))}
          </motion.div>
          <motion.div
            className="bg-[#303131] w-full mt-5 lg:mt-1 lg:w-[90%] rounded-[24px] p-5"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 1.1 }}
          >
            <motion.textarea
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 1.2 }}
              className="w-full min-h-[80px] bg-transparent text-white placeholder:text-[#DAD0D0] font-medium border-none focus:outline-none resize-none"
              placeholder="Ask anything ..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!address) {
                    setShowModal(true);
                    return;
                  } else {
                    handleSendMessage();
                  }
                }
              }}
            ></motion.textarea>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 1.4 }}
              className=" flex justify-between items-center  "
            >
              <div className="h-[41px] flex items-center gap-3 ">
                {/* <button className="flex items-center lg:gap-2 border-[#474848] border bg-[#282A2E] w-[48px] h-[48px] lg:h-full  lg:px-5 lg:w-[123px] rounded-full justify-center hover:bg-[#d94d32] text-white cursor-pointer lg:rounded-[24px] transition-colors">
                  <Image
                    src={"/icons/rewards-white.svg"}
                    alt="reward"
                    width={18}
                    className=""
                    height={18}
                  />
                  <span className="text-sm hidden lg:flex">Rewards</span>
                </button> */}
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: 1.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDefiOptions(!showDefiOptions)}
                  className={`flex items-center gap-2 border-[#474848] border bg-[#282A2E] h-full lg:px-5 w-[65px] lg:w-[197px] justify-center relative hover:border-primary text-white cursor-pointer rounded-[24px] ${
                    showDefiOptions ? "border-primary" : " "
                  }`}
                >
                  {showDefiOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute ${
                        showDefiOptions ? "opacity-100" : "opacity-0"
                      } duration-300 transition-all -top-1 -translate-y-full left-0 w-full px-[5px] py-[9px] flex flex-col gap-2  bg-[#282A2E] rounded-lg z-10`}
                    >
                      {DefiOptions.map((option, index) => (
                        <motion.div
                          key={option.title}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-2 px-4 py-2 text-white  text-xs cursor-pointer hover:bg-[#1E1F1F] rounded-[14px] w-full text-left transition-colors"
                        >
                          <Image
                            src={option.icon}
                            alt={option.title}
                            width={16}
                            height={16}
                          />
                          {option.title}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  <span
                    className={`${
                      showDefiOptions ? "text-primary" : "text-white"
                    }`}
                  >
                    <svg
                      width="20"
                      height="21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.5 2.5a.5.5 0 01.5.5v.5h.5a.5.5 0 010 1H17V5a.5.5 0 01-1 0v-.5h-.5a.5.5 0 010-1h.5V3a.5.5 0 01.5-.5zm-13 13a.5.5 0 01.5.5v.5h.5a.5.5 0 010 1H4v.5a.5.5 0 01-1 0v-.5h-.5a.5.5 0 010-1H3V16a.5.5 0 01.5-.5zm4.001-13c-.65 0-1.126.513-1.239 1.058a4.15 4.15 0 01-1.115 2.089c-.714.715-1.54 1-2.087 1.114-.546.113-1.06.59-1.06 1.241.001.65.514 1.124 1.059 1.237a4.134 4.134 0 012.087 1.114 4.156 4.156 0 011.115 2.09c.114.543.589 1.057 1.239 1.057.65 0 1.126-.514 1.24-1.059a4.13 4.13 0 011.113-2.087 4.14 4.14 0 012.088-1.115C12.487 9.126 13 8.651 13 8c0-.65-.513-1.126-1.059-1.239a4.14 4.14 0 01-2.087-1.114A4.15 4.15 0 018.74 3.558C8.627 3.013 8.151 2.5 7.501 2.5zM7 15.5v-1.057a2.1 2.1 0 001 0V15.5a2 2 0 002 2h5a2 2 0 002-2v-5a2 2 0 00-2-2h-1.058a2.1 2.1 0 000-1H15a3 3 0 013 3v5a3 3 0 01-3 3h-5a3 3 0 01-3-3zm3-1.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zm.5-2.5a.5.5 0 000 1H15a.5.5 0 000-1h-4.5z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>

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
                </motion.button>
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
                      <div className="bg-[#282A2E]  -translate-x-[30%] text-[#d9d9d9] text-xs lg:text-sm rounded-[12px] px-4 lg:px-8 py-3 lg:py-6 shadow-lg w-[250px] lg:w-[342px] text-center font-medium whitespace-pre-line">
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
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: 1.5 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (!address) {
                      setShowModal(true);
                      return;
                    } else {
                      handleSendMessage();
                    }
                  }}
                  className="bg-[#A9A0FF] cursor-pointer active:scale-90 hover:bg-primary duration-500 w-[32px] h-[32px] lg:w-[42px] lg:h-[42px] rounded-full flex justify-center items-center"
                >
                  <div className="relative w-[22px] lg:w-[24px] h-[22px] lg:h-[24px]">
                    <Image
                      src={"/icons/arrow-right.svg"}
                      alt="arrow"
                      width={24}
                      height={24}
                    />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatSection;
