import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import AgentCard from "../components/AgentCard";

// Mock next/navigation router
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock hook used for chat room management
const createChatRoomMock = jest.fn();
const loadChatRoomsMock = jest.fn(() => ({}));
jest.mock("@/hooks/useChatRoomsMessages", () => ({
  useChatRoomsMessages: () => ({
    createChatRoom: createChatRoomMock,
    loadChatRooms: loadChatRoomsMock,
  }),
}));

describe("AgentCard", () => {
  const baseProps = {
    icon: "/icons/exyra.svg",
    title: "Test Agent",
    subtitle: "Helpful assistant",
    features: ["One", "Two"],
    prompts: ["Do something", "Another task"],
    chains: ["Ethereum", "Base"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, subtitle, features and prompts", () => {
    render(<AgentCard {...baseProps} />);
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
    expect(screen.getByText(/Helpful assistant/i)).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.getByText("Do something")).toBeInTheDocument();
    expect(screen.getByText("Another task")).toBeInTheDocument();
  });

  it("creates a chat room and navigates when a prompt is clicked", () => {
    render(<AgentCard {...baseProps} />);
    const promptBtn = screen.getByText("Do something");
    fireEvent.click(promptBtn);

    // Ensures a chat was created and router.push called with chat id and prompt param
    expect(createChatRoomMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalled();
    const url = String(pushMock.mock.calls[0][0]);
    expect(url).toContain("/chat/");
    expect(url).toContain(encodeURIComponent("Do something"));
  });
});
