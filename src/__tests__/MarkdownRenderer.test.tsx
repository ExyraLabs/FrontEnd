import { render, screen } from "@testing-library/react";
import React from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders markdown headings and lists", () => {
    const content = "# Title\n\n- item 1\n- item 2\n\n`code`";
    render(<MarkdownRenderer content={content} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Title" })
    ).toBeInTheDocument();
    expect(screen.getByText("item 1")).toBeInTheDocument();
    expect(screen.getByText("item 2")).toBeInTheDocument();
    expect(screen.getByText("code")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MarkdownRenderer content={"text"} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
