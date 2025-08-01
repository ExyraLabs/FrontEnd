"use client";
import Modal from "@/components/Modal";
import { useChatRoomsMessages } from "@/hooks/useChatRoomsMessages";
import { useSavedPrompts } from "@/hooks/useSavedPrompts";
import { useAppKitAccount } from "@reown/appkit/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  TextMessage,
  ActionExecutionMessage,
  ResultMessage,
  Role,
  BaseMessageOutput,
} from "@copilotkit/runtime-client-gql";
import {
  useCopilotChat,
  useCopilotMessagesContext,
} from "@copilotkit/react-core";

const examples = [
  "How can I get started?",
  "Tell me more about DeFi",
  "How can I earn rewards?",
];

const Page = () => {
  const [showDefiOptions, setShowDefiOptions] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { address } = useAppKitAccount();
  const [showModal, setShowModal] = useState(!false);
  const params = useParams();
  const id = params.id as string;
  const { getMessages, saveChatRoomMessages } = useChatRoomsMessages();
  const { savePrompt, isPromptSaved, loadSavedPrompts, deletePromptByContent } =
    useSavedPrompts();
  const [savedPrompts, setSavedPrompts] = useState<Set<string>>(new Set());
  const messages = getMessages(id);
  const { visibleMessages, appendMessage, isLoading } = useCopilotChat({
    id: id,
    initialMessages: messages,
  });

  console.log(loadSavedPrompts(), "SavedPrompts");
  console.log(
    `Chat ID: ${id}, Messages loaded: ${messages.length}, Visible messages: ${visibleMessages.length}`
  );

  const { setMessages } = useCopilotMessagesContext();

  // const handleSendMessage = () => {
  //   console.log(id, "Chat-Id");
  // };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    appendMessage(new TextMessage({ content, role: Role.User }));
    setInputValue("");
  };

  const handleSendMessage = () => {
    sendMessage(inputValue);
  };

  const renderTextMessage = (message: BaseMessageOutput, index: number) => {
    const textMessage = message as TextMessage;
    const isUser = textMessage.role === Role.User;
    const messageContent = textMessage.content || "";
    const promptIsSaved = isUser && isPromptSaved(messageContent);
    console.log(promptIsSaved, "Prompt Is Saved");

    const handleSavePrompt = () => {
      if (promptIsSaved) {
        // Remove prompt from saved prompts
        deletePromptByContent(messageContent);
        setSavedPrompts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(messageContent.trim());
          return newSet;
        });
        console.log("Prompt removed from saved!");
      } else {
        savePrompt(messageContent);
        setSavedPrompts((prev) => new Set([...prev, messageContent.trim()]));
        console.log("Prompt saved!");
      }
    };

    return (
      <div
        key={`text-${message.id}-${index}`}
        className={`flex flex-col  w-max max-w-[600px]  relative ${
          isUser ? "self-end" : "self-start"
        }`}
      >
        <div
          className={`rounded-bl-[20px]  rounded-br-[20px] rounded-tl-[20px]  ${
            isUser ? "px-4 py-[15px] " : ""
          }  ${isUser ? "bg-[#2e2e2e] " : ""} text-[#D9D9D9]`}
        >
          {isUser ? (
            <p className="text-sm">{messageContent}</p>
          ) : (
            <MarkdownRenderer content={messageContent} />
          )}
        </div>
        <div
          className={`gap-2 mt-2 w-full ${
            isUser ? "justify-end" : "justify-start"
          }  flex items-center`}
        >
          {isUser && (
            <button
              className={`cursor-pointer relative flex items-center justify-center hover:opacity-70 transition-opacity`}
              onClick={handleSavePrompt}
              title={promptIsSaved ? "Prompt already saved" : "Save prompt"}
            >
              {promptIsSaved && (
                <div className="absolute bg-[#888] w-1 h-1 rounded-full" />
              )}
              <Image
                src={"/icons/save.svg"}
                width={16}
                height={16}
                alt="save"
              />
            </button>
          )}
          <button className="cursor-pointer">
            <Image src={"/icons/copy.svg"} width={16} height={16} alt="copy" />
          </button>
        </div>
      </div>
    );
  };
  console.log(messages, "Visible Messages");

  useEffect(() => {
    // Only run this effect when we first load a chat room or when we have exactly 1 message
    if (messages.length === 1) {
      const firstMessage = messages[0] as TextMessage;
      if (firstMessage.role === Role.User) {
        sendMessage(firstMessage.content);
      }
    }

    // Always sync the loaded messages to CopilotKit context
    setMessages(messages);
    //eslint-disable-next-line
  }, [messages.length]); // Only depend on id changes, not messages.length

  useEffect(() => {
    // Load saved prompts state on mount
    const savedPromptsData = loadSavedPrompts();
    const savedContents = new Set(
      savedPromptsData.map((p) => p.content.trim())
    );
    setSavedPrompts(savedContents);
  }, [loadSavedPrompts]);

  useEffect(() => {
    // Only save if we have messages and not currently loading
    // Add a debounce to prevent too frequent saves
    if (!isLoading && visibleMessages.length > 0) {
      const saveTimeout = setTimeout(() => {
        saveChatRoomMessages(id, visibleMessages);
      }, 500); // Debounce saves by 500ms

      return () => clearTimeout(saveTimeout);
    }
    //eslint-disable-next-line
  }, [isLoading, visibleMessages.length, id]);

  // useEffect(() => {
  //   scrollToBottom();
  // }, [visibleMessages]);

  return (
    <div className="  h-[88vh] mb-4 px-4 pt-4 relative flex flex-col">
      <div
        className="flex flex-col h-[78vh]   overflow-y-auto pr-2"
        style={{ minHeight: 0 }}
      >
        {visibleMessages.map((message, idx) => {
          const messageType = message?.type || message.constructor.name;
          // Render text messages (User and Assistant)
          if (messageType === "TextMessage" || (message as TextMessage).role) {
            return renderTextMessage(message, idx);
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input section */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="bg-[#303131] w-full mt-5 lg:mt-1 lg:w-full rounded-[24px] p-5"
      >
        <textarea
          className="w-full min-h-[10px] bg-transparent text-white placeholder:text-[#DAD0D0] font-medium border-none focus:outline-none resize-none"
          value={inputValue}
          placeholder="Ask anything ..."
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        ></textarea>
        <div className="flex w-full justify-end items-center">
          <div className="flex items-center gap-3 relative">
            {/* Message Counter and Tooltip */}
            <div className="flex items-center gap-1 relative">
              <span className="text-[#888888] text-[8px] lg:text-xs font-medium select-none">
                29 / 30 messages
              </span>
              <div className="relative flex items-center group">
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
                <div className="absolute bottom-[120%] right-1/2 translate-x-1/2 z-20 hidden group-hover:flex group-focus-within:flex flex-col items-center">
                  <div className="bg-[#282A2E] -translate-x-[30%] text-[#d9d9d9] text-xs lg:text-sm rounded-[12px] px-4 lg:px-8 py-3 lg:py-6 shadow-lg w-[250px] lg:w-[342px] text-center font-medium whitespace-pre-line">
                    Daily message limit: 30 messages per wallet.Resets daily at
                    midnight UTC
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
            <button
              onClick={handleSendMessage}
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
            </button>
          </div>
        </div>
      </motion.div>
      {/* <button className="flex absolute bottom-5 right-5  items-center gap-2 border-[#474848] border bg-primary lg:w-[251px] w-[40px] h-[40px] justify-center hover:bg-[#A9A0FF] text-white cursor-pointer rounded-full lg:rounded-[24px] transition-colors">
        <Image src={"/icons/star.svg"} alt="reward" width={20} height={20} />
        <span className="hidden lg:flex">Gain Recommendation</span>
      </button> */}
    </div>
  );
};

export default Page;
