"use client";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { ToolRenderer } from "@/components/ToolRenderer";
import { useChatRoomsMessages } from "@/hooks/useChatRoomsMessages";
import { useSavedPrompts } from "@/hooks/useSavedPrompts";
import { useAppKitAccount } from "@reown/appkit/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  TextMessage,
  ActionExecutionMessage,
  ResultMessage,
  Role,
} from "@copilotkit/runtime-client-gql";
import {
  useCopilotChat,
  useCopilotMessagesContext,
} from "@copilotkit/react-core";
import { BaseMessage, CombinedToolCall } from "../../../../types";

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // console.log(loadSavedPrompts(), "SavedPrompts");
  // console.log(
  //   `Chat ID: ${id}, Messages loaded: ${messages.length}, Visible messages: ${visibleMessages.length}`
  // );

  const { messages: contextMessages, setMessages } =
    useCopilotMessagesContext();

  // Actively filter context messages to prevent corrupted tool calls
  useEffect(() => {
    if (contextMessages.length > 0) {
      console.log(
        "Context messages before filtering:",
        contextMessages.map((msg, i) => ({
          index: i,
          id: msg.id,
          type: (msg as BaseMessage)?.type || msg.constructor.name,
          role: (msg as TextMessage)?.role,
        }))
      );

      // Since we're not saving tool calls, only filter if there are actually orphaned tool calls
      const orphanedToolCalls = contextMessages.filter((msg) => {
        const messageType = (msg as BaseMessage)?.type || msg.constructor.name;

        if (messageType === "ActionExecutionMessage") {
          const actionMsg = msg as unknown as ActionExecutionMessage;
          const hasResult = contextMessages.some((resultMsg) => {
            const resultType =
              (resultMsg as BaseMessage)?.type || resultMsg.constructor.name;
            return (
              resultType === "ResultMessage" &&
              (resultMsg as unknown as ResultMessage).actionExecutionId ===
                actionMsg.id
            );
          });
          return !hasResult; // Return true if this is orphaned
        }

        if (messageType === "ResultMessage") {
          const resultMsg = msg as unknown as ResultMessage;
          const hasAction = contextMessages.some((actionMsg) => {
            const actionType =
              (actionMsg as BaseMessage)?.type || actionMsg.constructor.name;
            return (
              actionType === "ActionExecutionMessage" &&
              (actionMsg as unknown as ActionExecutionMessage).id ===
                resultMsg.actionExecutionId
            );
          });
          return !hasAction; // Return true if this is orphaned
        }

        return false;
      });

      // Only filter if we find orphaned tool calls
      if (orphanedToolCalls.length > 0) {
        console.log(
          `Found ${orphanedToolCalls.length} orphaned tool calls, filtering...`
        );
        const cleanContextMessages = contextMessages.filter((msg) => {
          const messageType =
            (msg as BaseMessage)?.type || msg.constructor.name;
          return messageType === "TextMessage"; // Only keep text messages to be safe
        });
        console.log(
          `Filtering context messages: ${contextMessages.length} -> ${cleanContextMessages.length}`
        );
        setMessages(cleanContextMessages);
      }
    }
  }, [contextMessages, setMessages]);

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

  // Create a display-only version of messages that combines tool calls for UI
  const getDisplayMessages = () => {
    const displayMessages: BaseMessage[] = [];
    const toolCallsMap = new Map<
      string,
      {
        action?: ActionExecutionMessage;
        result?: ResultMessage;
      }
    >();

    // Process messages for display only
    for (const message of visibleMessages) {
      const messageType =
        (message as BaseMessage)?.type || message.constructor.name;

      if (messageType === "ActionExecutionMessage") {
        const actionMsg = message as unknown as ActionExecutionMessage;
        if (!toolCallsMap.has(actionMsg.id)) {
          toolCallsMap.set(actionMsg.id, {});
        }
        toolCallsMap.get(actionMsg.id)!.action = actionMsg;
      } else if (messageType === "ResultMessage") {
        const resultMsg = message as unknown as ResultMessage;
        const actionId = resultMsg.actionExecutionId;
        if (!toolCallsMap.has(actionId)) {
          toolCallsMap.set(actionId, {});
        }
        toolCallsMap.get(actionId)!.result = resultMsg;
      } else if (messageType === "TextMessage") {
        // Add text messages directly
        displayMessages.push(message as BaseMessage);
      }
    }

    // Add combined tool calls for display
    toolCallsMap.forEach((toolCall) => {
      if (toolCall.action) {
        displayMessages.push({
          ...toolCall.action,
          type: "CombinedToolCall",
          result: toolCall.result,
          createdAt: toolCall.action.createdAt,
        } as CombinedToolCall);
      }
    });

    // Sort by creation time
    return displayMessages.sort((a, b) => {
      const aTime = new Date((a as BaseMessage).createdAt || "0").getTime();
      const bTime = new Date((b as BaseMessage).createdAt || "0").getTime();
      return aTime - bTime;
    });
  };

  const displayMessages = getDisplayMessages();

  const renderToolMessage = (message: BaseMessage, index: number) => {
    const messageType =
      (message as BaseMessage)?.type || message.constructor.name;

    if (messageType === "CombinedToolCall") {
      const toolCall = message as CombinedToolCall;
      const isSuccess = toolCall.result?.status?.code === "Success";
      const hasResult = !!toolCall.result;

      // Show loading state or result
      if (!hasResult) {
        return (
          <div
            key={`tool-${message.id}-${index}`}
            className="flex items-center gap-2 mb-2 text-gray-400 text-sm"
          >
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Running {toolCall.name}...</span>
          </div>
        );
      }

      return (
        <div
          key={`tool-${message.id}-${index}`}
          className="flex items-center gap-2 mb-2 text-gray-300 text-sm"
        >
          <span className={isSuccess ? "text-green-400" : "text-red-400"}>
            {isSuccess ? "✓" : "✗"}
          </span>
          <span>
            {isSuccess ? "Completed" : "Failed"} {toolCall.name}
            {/* {toolCall.result?.result && isSuccess && (
              <span className="text-gray-400">
                {" "}
                - {toolCall.result.result.slice(0, 60)}
                {toolCall.result.result.length > 60 ? "..." : ""}
              </span>
            )} */}
          </span>
        </div>
      );
    }

    return null;
  };

  const renderTextMessage = (message: BaseMessage, index: number) => {
    const textMessage = message as TextMessage;
    const isUser = textMessage.role === Role.User;
    const messageContent = textMessage.content || "";
    const promptIsSaved = isUser && isPromptSaved(messageContent);

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
              {promptIsSaved ? (
                <Image
                  src={"/icons/save-filled.svg"}
                  width={16}
                  height={16}
                  alt="save"
                />
              ) : (
                <Image
                  src={"/icons/save.svg"}
                  width={16}
                  height={16}
                  alt="save"
                />
              )}
            </button>
          )}
          {!isLoading && (
            <button className="cursor-pointer">
              <Image
                src={"/icons/copy.svg"}
                width={16}
                height={16}
                alt="copy"
              />
            </button>
          )}
        </div>
      </div>
    );
  };
  // console.log(messages, " Messages");
  console.log(visibleMessages, "Visible Messages");
  console.log(displayMessages, "Display Messages");

  // Debug: Log message types to understand the structure
  console.log(
    "Message types:",
    visibleMessages.map((msg, i) => ({
      index: i,
      id: msg.id,
      type: (msg as BaseMessage)?.type || msg.constructor.name,
      role: (msg as TextMessage)?.role,
      actionId: (msg as unknown as ActionExecutionMessage)?.id,
      resultActionId: (msg as unknown as ResultMessage)?.actionExecutionId,
    }))
  );
  // console.log(ContextMessages, "Context Messages");

  // Debug function to clear corrupted state
  const clearConversation = () => {
    setMessages([]);
    saveChatRoomMessages(id, []);
    window.location.reload();
  };

  useEffect(() => {
    // Only sync messages on initial load for existing conversations
    if (messages.length > 0 && visibleMessages.length === 0) {
      // Filter out any potentially corrupted tool calls
      const cleanMessages = messages.filter((msg) => {
        const messageType = (msg as BaseMessage)?.type || msg.constructor.name;
        // Only keep TextMessages to avoid tool call corruption
        return messageType === "TextMessage";
      });

      console.log(
        `Loading clean messages: ${messages.length} -> ${cleanMessages.length}`
      );

      if (cleanMessages.length > 0) {
        setMessages(cleanMessages);

        // If we have exactly 1 message and it's a user message, resend it
        if (cleanMessages.length === 1) {
          const firstMessage = cleanMessages[0] as TextMessage;
          if (firstMessage.role === Role.User) {
            setTimeout(() => {
              sendMessage(firstMessage.content);
            }, 100); // Small delay to ensure context is set
          }
        }
      }
    }

    //eslint-disable-next-line
  }, [id, visibleMessages.length]); // Also depend on visibleMessages.length to avoid interference

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
        // Only save TextMessages to prevent any tool call corruption
        const cleanMessagesToSave = visibleMessages.filter((msg) => {
          const messageType =
            (msg as BaseMessage)?.type || msg.constructor.name;
          // Only keep TextMessages - completely avoid saving tool calls
          return messageType === "TextMessage";
        });

        console.log(
          `Saving only text messages: ${visibleMessages.length} -> ${cleanMessagesToSave.length}`
        );
        saveChatRoomMessages(id, cleanMessagesToSave);
      }, 500); // Debounce saves by 500ms

      return () => clearTimeout(saveTimeout);
    }
    //eslint-disable-next-line
  }, [isLoading, visibleMessages.length, id]);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  return (
    <div className="  h-[88vh] mb-4 px-4 pt-4 relative flex flex-col">
      <ConnectWalletModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <div
        className="flex flex-col h-[78vh]   overflow-y-auto pr-2"
        style={{ minHeight: 0 }}
      >
        {displayMessages.map((message, idx) => {
          const messageType =
            (message as BaseMessage)?.type || message.constructor.name;

          // Render combined tool messages
          if (messageType === "CombinedToolCall") {
            return renderToolMessage(message, idx);
          }

          // Render text messages (User and Assistant)
          if (messageType === "TextMessage" || (message as TextMessage).role) {
            return renderTextMessage(message, idx);
          }

          // Skip other message types (individual ActionExecution and Result messages are now combined)
          return null;
        })}

        {/* AI Thinking Animation */}
        {isLoading && (
          <div className="flex flex-col w-max max-w-[600px] self-start">
            <div className="flex items-center gap-3 py-4">
              <span className="text-[#888888] text-sm">AI is thinking</span>
              <div className="flex items-center gap-1">
                <motion.div
                  className="w-2 h-2 bg-[#A9A0FF] rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#A9A0FF] rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#A9A0FF] rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                />
              </div>
            </div>
          </div>
        )}

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
              if (!address) {
                setShowModal(true);
                return;
              } else {
                handleSendMessage();
              }
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
            </button>
          </div>
        </div>
      </motion.div>

      <ToolRenderer />
    </div>
  );
};

export default Page;
