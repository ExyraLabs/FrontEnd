import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

// Override next/navigation to capture push calls
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",
}));

// Test data helpers
const makeDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

const deleteChatRoomMock = jest.fn();

// Mock hooks used inside Sidebar
jest.mock("@/hooks/useChatRoomsMessages", () => ({
  useChatRoomsMessages: () => ({
    loadChatRooms: () => ({
      chat_today: [
        {
          id: "m1",
          type: "TextMessage",
          createdAt: makeDate(0),
          content: "Hello world",
        },
      ],
      chat_yesterday: [
        {
          id: "m2",
          type: "TextMessage",
          createdAt: makeDate(-1),
          content: "Yesterday notes",
        },
      ],
      chat_prev7: [
        {
          id: "m3",
          type: "TextMessage",
          createdAt: makeDate(-3),
          content: "Midweek",
        },
      ],
      chat_prev30: [
        {
          id: "m4",
          type: "TextMessage",
          createdAt: makeDate(-20),
          content: "Last month",
        },
      ],
    }),
    deleteChatRoom: deleteChatRoomMock,
    getChatTitle: (id: string) =>
      ((
        {
          chat_today: "Hello world",
          chat_yesterday: "Yesterday notes",
          chat_prev7: "Midweek",
          chat_prev30: "Last month",
        } as Record<string, string>
      )[id] ?? `Chat ${id}`),
  }),
}));

const deletePromptMock = jest.fn();

jest.mock("@/hooks/useSavedPrompts", () => ({
  useSavedPrompts: () => ({
    loadSavedPrompts: () => [
      {
        id: "p1",
        content: "Swap 1 ETH to USDC",
        title: "Swap",
        createdAt: new Date().toISOString(),
      },
      {
        id: "p2",
        content: "Stake ETH with Lido",
        title: "Stake",
        createdAt: new Date().toISOString(),
      },
    ],
    deletePrompt: deletePromptMock,
  }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to a chat when a chat item is clicked", async () => {
    render(<Sidebar open={true} onClose={() => {}} />);
    const listItems = await screen.findAllByRole("listitem");
    const targetLi = listItems.find((li) =>
      li.textContent?.includes("Hello world")
    ) as HTMLElement;
    expect(targetLi).toBeTruthy();
    fireEvent.click(targetLi);
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/chat\/chat_today$/)
    );
  });

  it("opens Search modal and filters chats", () => {
    render(<Sidebar open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText(/search/i));
    const input = screen.getByPlaceholderText("Search chats...");
    fireEvent.change(input, { target: { value: "Hello" } });
    // Shows Search Results heading
    expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
  });

  it("opens Saved Prompts modal and filters prompts", () => {
    render(<Sidebar open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText(/saved prompts/i));
    const input = screen.getByPlaceholderText("Search saved prompts...");
    fireEvent.change(input, { target: { value: "Stake" } });
    // Search results with count
    expect(screen.getByText(/Search Results \(1\)/i)).toBeInTheDocument();
  });

  it("new chat button and close button behave correctly", () => {
    const onClose = jest.fn();
    render(<Sidebar open={true} onClose={onClose} />);
    // New Chat top button
    const container = screen
      .getByText("New Chat")
      .closest("button") as HTMLElement;
    fireEvent.click(container);
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(onClose).toHaveBeenCalled();

    // Mobile close button
    const closeBtn = screen.getByRole("button", { name: /close sidebar/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
