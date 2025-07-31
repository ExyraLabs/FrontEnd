import { useEffect, useCallback } from "react";
import {
  TextMessage,
  ActionExecutionMessage,
  ResultMessage,
  Role,
  Message,
} from "@copilotkit/runtime-client-gql";
import { useCopilotMessagesContext } from "@copilotkit/react-core";

export type ChatRoomMessages = {
  [chatId: string]: Message[];
};

const STORAGE_KEY = "copilotkit-chatrooms";

export function useChatRoomsMessages() {
  const { messages, setMessages } = useCopilotMessagesContext();

  // Load all chat rooms and their messages from localStorage
  const loadChatRooms = useCallback((): ChatRoomMessages => {
    if (typeof window === "undefined") return {};
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    try {
      const parsed = JSON.parse(stored);
      // Rehydrate messages
      Object.keys(parsed).forEach((chatId) => {
        //eslint-disable-next-line
        parsed[chatId] = parsed[chatId].map((message: any) => {
          // Use Message type constructor for all
          return new Message(message);
        });
      });
      return parsed;
    } catch {
      return {};
    }
  }, []);

  // Save all chat rooms and their messages to localStorage
  const saveChatRooms = useCallback((chatRooms: ChatRoomMessages) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chatRooms));
  }, []);

  // Add a message to a chat room
  const addMessage = useCallback(
    (chatId: string, message: Message) => {
      const chatRooms = loadChatRooms();
      if (!chatRooms[chatId]) chatRooms[chatId] = [];
      chatRooms[chatId].push(message);
      saveChatRooms(chatRooms);
    },
    [loadChatRooms, saveChatRooms]
  );

  // Delete a message from a chat room by message id
  const deleteMessage = useCallback(
    (chatId: string, messageId: string) => {
      const chatRooms = loadChatRooms();
      if (!chatRooms[chatId]) return;
      chatRooms[chatId] = chatRooms[chatId].filter(
        (msg: Message) => msg.id !== messageId
      );
      saveChatRooms(chatRooms);
    },
    [loadChatRooms, saveChatRooms]
  );

  // Save or replace all messages in a chat room
  const saveChatRoomMessages = useCallback(
    (chatId: string, messages: Message[]) => {
      const chatRooms = loadChatRooms();
      chatRooms[chatId] = messages;
      saveChatRooms(chatRooms);
    },
    [loadChatRooms, saveChatRooms]
  );

  // Delete an entire chat room
  const deleteChatRoom = useCallback(
    (chatId: string) => {
      const chatRooms = loadChatRooms();
      delete chatRooms[chatId];
      saveChatRooms(chatRooms);
    },
    [loadChatRooms, saveChatRooms]
  );

  // Get messages for a chat room
  const getMessages = useCallback(
    (chatId: string): Message[] => {
      const chatRooms = loadChatRooms();
      return chatRooms[chatId] || [];
    },
    [loadChatRooms]
  );

  // Optionally, sync with localStorage changes
  useEffect(() => {
    // You can add logic here to sync with other state if needed
  }, []);

  return {
    loadChatRooms,
    saveChatRooms,
    addMessage,
    deleteMessage,
    deleteChatRoom,
    getMessages,
    saveChatRoomMessages,
  };
}
