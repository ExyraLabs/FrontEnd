import { useEffect, useCallback } from "react";
import { Message } from "@copilotkit/runtime-client-gql";

export type ChatRoomMessages = {
  [chatId: string]: Message[];
};

export type ChatRoomTitles = {
  [chatId: string]: string;
};

const STORAGE_KEY = "copilotkit-chatrooms";
const TITLES_STORAGE_KEY = "copilotkit-chat-titles";

export function useChatRoomsMessages() {
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

  // Load chat titles from localStorage
  const loadChatTitles = useCallback((): ChatRoomTitles => {
    if (typeof window === "undefined") return {};
    const stored = window.localStorage.getItem(TITLES_STORAGE_KEY);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }, []);

  // Save all chat rooms and their messages to localStorage
  const saveChatRooms = useCallback((chatRooms: ChatRoomMessages) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chatRooms));
  }, []);

  // Save chat titles to localStorage
  const saveChatTitles = useCallback((titles: ChatRoomTitles) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TITLES_STORAGE_KEY, JSON.stringify(titles));
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

  // Create a new chat room with a title
  const createChatRoom = useCallback(
    (chatId: string, title: string, initialMessage?: Message) => {
      const chatRooms = loadChatRooms();
      const titles = loadChatTitles();

      // Only create if it doesn't exist
      if (!chatRooms[chatId]) {
        chatRooms[chatId] = [];

        // Generate title from the initial message content if it's a TextMessage
        let generatedTitle = title;
        if (
          initialMessage &&
          initialMessage.type === "TextMessage" &&
          "content" in initialMessage
        ) {
          const content = initialMessage.content as string;
          generatedTitle =
            content.length > 50 ? content.slice(0, 50) + "..." : content;
        }

        titles[chatId] = generatedTitle;

        if (initialMessage) {
          chatRooms[chatId].push(initialMessage);
        }

        saveChatRooms(chatRooms);
        saveChatTitles(titles);
      }
    },
    [loadChatRooms, loadChatTitles, saveChatRooms, saveChatTitles]
  );

  // Get title for a chat room
  const getChatTitle = useCallback(
    (chatId: string): string => {
      const titles = loadChatTitles();

      // If we have a stored title, use it
      if (titles[chatId]) {
        return titles[chatId];
      }

      // Fallback: generate title from first message
      const chatRooms = loadChatRooms();
      const messages = chatRooms[chatId];
      if (messages && messages.length > 0) {
        const firstMessage = messages[0];
        if (firstMessage.type === "TextMessage" && "content" in firstMessage) {
          const content = firstMessage.content as string;
          const generatedTitle =
            content.length > 50 ? content.slice(0, 50) + "..." : content;

          // Store this generated title for future use
          const updatedTitles = loadChatTitles();
          updatedTitles[chatId] = generatedTitle;
          saveChatTitles(updatedTitles);

          return generatedTitle;
        }
      }

      return `Chat ${chatId}`;
    },
    [loadChatTitles, loadChatRooms, saveChatTitles]
  );

  // Update title for a chat room
  const updateChatTitle = useCallback(
    (chatId: string, title: string) => {
      const titles = loadChatTitles();
      titles[chatId] = title;
      saveChatTitles(titles);
    },
    [loadChatTitles, saveChatTitles]
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
      const titles = loadChatTitles();
      delete chatRooms[chatId];
      delete titles[chatId];
      saveChatRooms(chatRooms);
      saveChatTitles(titles);
    },
    [loadChatRooms, loadChatTitles, saveChatRooms, saveChatTitles]
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
    loadChatTitles,
    saveChatTitles,
    addMessage,
    createChatRoom,
    getChatTitle,
    updateChatTitle,
    deleteMessage,
    deleteChatRoom,
    getMessages,
    saveChatRoomMessages,
  };
}
