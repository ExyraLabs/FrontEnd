import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Header from "@/components/Header";

// Mock child components that may have complex internals
jest.mock("@/components/Logo", () => ({
  __esModule: true,
  default: function Logo() {
    return <div data-testid="logo" />;
  },
}));
jest.mock("@/components/WalletConnector", () => ({
  __esModule: true,
  default: function WalletConnector() {
    return <div data-testid="wallet-connector" />;
  },
}));
jest.mock("@/components/Sidebar", () => ({
  __esModule: true,
  default: function SidebarMock(props: { open?: boolean }) {
    return <div data-testid="sidebar" data-open={String(!!props.open)} />;
  },
}));

describe("Header", () => {
  it("renders logo and wallet connector", () => {
    render(<Header />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-connector")).toBeInTheDocument();
  });

  it("toggles sidebar open/close via hamburger button", () => {
    render(<Header />);
    const button = screen.getByRole("button", { name: /toggle sidebar/i });
    // Initially closed
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-open", "false");
    // Open
    fireEvent.click(button);
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-open", "true");
    // Close
    fireEvent.click(button);
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-open", "false");
  });
});
