import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { initialColumns } from "@/lib/board";
import { mockFetch, renderWithSWR } from "@/test/render";
import BoardPage from "./BoardPage";

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "b1" }), useRouter: () => ({ replace: vi.fn() }) }));

const me = (): [number, unknown] => [200, { id: "u1", name: "Alice", email: "a@example.com" }];

describe("BoardPage", () => {
  it("loads the board from the API", async () => {
    mockFetch({
      "GET /api/auth/me": me,
      "GET /api/boards/b1": () => [200, { id: "b1", name: "Launch board", columns: initialColumns, updatedAt: 0 }],
    });
    renderWithSWR(<BoardPage />);
    expect(screen.getByText("Loading board")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Launch board" })).toBeInTheDocument();
    expect(screen.getAllByTestId("card")).toHaveLength(10);
  });

  it("shows a not found message for a missing board", async () => {
    mockFetch({ "GET /api/boards/b1": () => [404, { error: "Board not found" }] });
    renderWithSWR(<BoardPage />);
    expect(await screen.findByRole("heading", { name: "Board not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to your boards" })).toHaveAttribute("href", "/boards");
  });
});
