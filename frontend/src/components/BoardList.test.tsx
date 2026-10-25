import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BoardSummary } from "@/lib/board";
import { mockFetch, renderWithSWR } from "@/test/render";
import BoardList from "./BoardList";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

let boards: BoardSummary[];
let calls: ReturnType<typeof mockFetch>;

beforeEach(() => {
  push.mockReset();
  boards = [
    { id: "b1", name: "Website relaunch", cardCount: 10, updatedAt: Date.UTC(2026, 9, 1) },
    { id: "b2", name: "Hiring", cardCount: 1, updatedAt: Date.UTC(2026, 8, 1) },
  ];
  calls = mockFetch({
    "GET /api/auth/me": () => [200, { id: "u1", name: "Alice", email: "a@example.com" }],
    "GET /api/boards": () => [200, boards],
    "POST /api/boards": () => [201, { id: "new-id" }],
    "PATCH /api/boards/b2": (body) => {
      boards[1] = { ...boards[1], ...(body as object) };
      return [200, boards[1]];
    },
    "DELETE /api/boards/b2": () => {
      boards = boards.slice(0, 1);
      return [204];
    },
  });
});

const tile = (name: string) => screen.getAllByTestId("board-tile").find((t) => t.textContent?.includes(name))!;

describe("BoardList", () => {
  it("lists boards with card counts and links", async () => {
    renderWithSWR(<BoardList />);
    expect(await screen.findByText("2 boards")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website relaunch" })).toHaveAttribute("href", "/boards/b1");
    expect(within(tile("Website relaunch")).getByText("10 cards")).toBeInTheDocument();
    expect(within(tile("Hiring")).getByText("1 card")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Alice" })).toHaveAttribute("href", "/account");
  });

  it("refetches the list each time it is shown", async () => {
    const cache = new Map();
    const { unmount } = renderWithSWR(<BoardList />, cache);
    expect(await screen.findByText("2 boards")).toBeInTheDocument();
    unmount();
    boards.push({ id: "b3", name: "Fresh", cardCount: 0, updatedAt: 0 });
    renderWithSWR(<BoardList />, cache);
    expect(await screen.findByText("3 boards")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    boards = [];
    renderWithSWR(<BoardList />);
    expect(await screen.findByText("No boards yet. Create one to get started.")).toBeInTheDocument();
    expect(screen.getByText("0 boards")).toBeInTheDocument();
  });

  it("creates a board and opens it", async () => {
    const user = userEvent.setup();
    renderWithSWR(<BoardList />);
    const create = screen.getByRole("button", { name: "Create board" });
    expect(create).toBeDisabled();
    await user.type(screen.getByLabelText("New board name"), "Roadmap{Enter}");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/boards/new-id"));
    expect(calls.find((c) => c.key === "POST /api/boards")!.body).toEqual({ name: "Roadmap" });
  });

  it("renames a board", async () => {
    const user = userEvent.setup();
    renderWithSWR(<BoardList />);
    await user.click(await screen.findByRole("button", { name: "Rename Hiring" }));
    const input = screen.getByLabelText("Board name");
    await user.clear(input);
    await user.type(input, "Recruiting{Enter}");
    expect(await screen.findByRole("link", { name: "Recruiting" })).toBeInTheDocument();
  });

  it("skips rename when cancelled, empty or unchanged", async () => {
    const user = userEvent.setup();
    renderWithSWR(<BoardList />);
    await user.click(await screen.findByRole("button", { name: "Rename Hiring" }));
    await user.type(screen.getByLabelText("Board name"), "x{Escape}");
    await user.click(screen.getByRole("button", { name: "Rename Hiring" }));
    await user.clear(screen.getByLabelText("Board name"));
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Rename Hiring" }));
    await user.keyboard("{Enter}");
    expect(screen.getByRole("link", { name: "Hiring" })).toBeInTheDocument();
    expect(calls.some((c) => c.key.startsWith("PATCH"))).toBe(false);
  });

  it("deletes a board after confirmation", async () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal("confirm", confirm);
    const user = userEvent.setup();
    renderWithSWR(<BoardList />);
    await user.click(await screen.findByRole("button", { name: "Delete Hiring" }));
    expect(calls.some((c) => c.key.startsWith("DELETE"))).toBe(false);
    await user.click(screen.getByRole("button", { name: "Delete Hiring" }));
    await waitFor(() => expect(screen.queryByText("Hiring")).not.toBeInTheDocument());
    expect(confirm).toHaveBeenCalledWith('Delete "Hiring" and all its cards?');
    expect(screen.getByText("1 board")).toBeInTheDocument();
  });
});
