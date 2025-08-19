import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { chainImageMapping } from "@/utils/constants";
import { useChatRoomsMessages } from "../hooks/useChatRoomsMessages";

interface AgentCardProps {
  icon: string;
  title: string;
  subtitle: string;
  features: string[];
  prompts: string[];
  chains: string[]; // array of supported chains
}

const AgentCard: React.FC<AgentCardProps> = ({
  icon,
  title,
  subtitle,
  features,
  prompts,
  chains,
}) => {
  const router = useRouter();
  const { createChatRoom, loadChatRooms } = useChatRoomsMessages();

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

  const handlePromptClick = (prompt: string) => {
    let chatId = generateUUID();
    const chatRooms = loadChatRooms();
    // Ensure unique chatId
    while (chatRooms[chatId]) {
      chatId = generateUUID();
    }

    // Create empty chat room without any messages
    createChatRoom(chatId, "");

    // Navigate to chat with prompt as URL parameter
    router.push(`/chat/${chatId}?prompt=${encodeURIComponent(prompt)}`);
  };
  return (
    <div className="bg-[#303131]  hover:border-white duration-1000 rounded-[16px] p-4 flex flex-col min-h-[350px] shadow-md border-[0.5px] border-[#303131]">
      {/* Header */}
      <div className="h-[25%] border-b border-[#474848]  flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 relative flex items-center justify-center rounded-full">
            <Image src={icon} alt={title} className="rounded-full" fill />
          </div>
          <div>
            <div className="text-white text-lg font-semibold leading-tight">
              {title}
            </div>
            <div className="text-[#B5B5B5] text-xs leading-tight">
              {subtitle.length > 30 ? `${subtitle.slice(0, 30)}...` : subtitle}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {chains.map((chain, idx) =>
            chainImageMapping[chain] ? (
              <div
                key={idx}
                style={{ zIndex: idx }}
                className={idx === 0 ? "relative" : "relative -ml-2.5 "}
              >
                <Image
                  src={chainImageMapping[chain]}
                  alt={chain}
                  width={24}
                  height={24}
                  className="inline-block rounded-full"
                />
              </div>
            ) : null
          )}
        </div>
      </div>
      {/* Features */}
      <div className="h-[30%] mt-3 ">
        <div className="text-[#9B9D9D] text-xs font-semibold mb-1">
          Supported Features
        </div>
        <ul className="list-disc pl-5 text-[#F5F7F7] text-xs space-y-1">
          {features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </div>
      {/* Prompts */}
      <div className="h-[45%] flex flex-col justify-end">
        <div className="text-[#9B9D9D] text-xs font-semibold mb-2">
          Suggested Prompts
        </div>
        <div className="flex flex-col gap-2">
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt)}
              className="flex cursor-pointer items-center gap-2 bg-[#262727] hover:bg-[#232323] rounded-[8px] px-3 py-2 transition-colors duration-200"
            >
              <span className="text-primary">
                <svg
                  width="19"
                  height="18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 8.991c-4.693 0-8.491 3.816-8.491 8.509 0-4.693-3.816-8.509-8.509-8.509 4.693 0 8.509-3.798 8.509-8.491A8.486 8.486 0 0018 8.991z"
                    fill="currentColor"
                    stroke="#A79EF5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-left text-xs lg:text-sm text-[#A79EF5]">
                {prompt}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
