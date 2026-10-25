import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { initialColumns, type Column } from "@/lib/board";
import { mockFetch, renderWithSWR } from "@/test/render";
import Board from "./Board";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const column = (name: string) => screen.getByRole("region", { name });
const board = { id: "b1", name: "Launch board", columns: initialColumns, updatedAt: 0 };

let calls: ReturnType<typeof mockFetch>;
let failSaves = false;

beforeEach(() => {
  failSaves = false;
  calls = mockFetch({
    "GET /api/auth/me": () => [200, { id: "u1", name: "Alice", email: "a@example.com" }],
    "PATCH /api/boards/b1": (body) => (failSaves ? [500, { error: "boom" }] : [200, { ...board, ...(body as object) }]),
  });
});

const patches = () => calls.filter((c) => c.key === "PATCH /api/boards/b1").map((c) => c.body as { name?: string; columns?: Column[] });
const lastColumns = () => patches().at(-1)!.columns!;

describe("Board", () => {
  it("renders the board name, columns and cards", async () => {
    renderWithSWR(<Board board={board} />);
    expect(screen.getByRole("button", { name: "Launch board" })).toBeInTheDocument();
    expect(screen.getAllByTestId("column")).toHaveLength(5);
    expect(screen.getByText("Write homepage copy")).toBeInTheDocument();
    expect(screen.getByText("10 cards across 5 stages")).toBeInTheDocument();
    expect(screen.getByText("2 done")).toBeInTheDocument();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(patches()).toHaveLength(0);
  });

  it("renames a column with Enter and saves it", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    await user.click(screen.getByRole("button", { name: "Backlog" }));
    const input = screen.getByLabelText("Column name");
    await user.clear(input);
    await user.type(input, "Ideas{Enter}");
    expect(column("Ideas")).toBeInTheDocument();
    await waitFor(() => expect(lastColumns()[0].title).toBe("Ideas"));
  });

  it("cancels rename with Escape and ignores empty names", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    await user.click(screen.getByRole("button", { name: "Review" }));
    await user.type(screen.getByLabelText("Column name"), "xyz{Escape}");
    expect(column("Review")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Review" }));
    await user.clear(screen.getByLabelText("Column name"));
    await user.keyboard("{Enter}");
    expect(column("Review")).toBeInTheDocument();
    expect(patches()).toHaveLength(0);
  });

  it("renames the board", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    await user.click(screen.getByRole("button", { name: "Launch board" }));
    const input = screen.getByLabelText("Board name");
    await user.clear(input);
    await user.type(input, "Relaunch{Enter}");
    expect(screen.getByRole("button", { name: "Relaunch" })).toBeInTheDocument();
    await waitFor(() => expect(patches()).toEqual([{ name: "Relaunch" }]));
    expect(screen.getByText("All changes saved")).toBeInTheDocument();
  });

  it("keeps the board name when rename is cancelled or unchanged", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    await user.click(screen.getByRole("button", { name: "Launch board" }));
    await user.type(screen.getByLabelText("Board name"), "x{Escape}");
    await user.click(screen.getByRole("button", { name: "Launch board" }));
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Launch board" })).toBeInTheDocument();
    expect(patches()).toHaveLength(0);
  });

  it("adds a card to a column and saves it", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    const done = column("Done");
    await user.click(within(done).getByRole("button", { name: "+ Add card" }));
    const submit = within(done).getByRole("button", { name: "Add card" });
    expect(submit).toBeDisabled();
    await user.type(within(done).getByLabelText("Card title"), "Ship it");
    await user.type(within(done).getByLabelText("Card details"), "Go live");
    await user.click(submit);
    expect(within(done).getByText("Ship it")).toBeInTheDocument();
    expect(within(done).getByText("Go live")).toBeInTheDocument();
    expect(within(done).getAllByTestId("card")).toHaveLength(3);
    await waitFor(() => expect(lastColumns()[4].cards.at(-1)).toMatchObject({ title: "Ship it", details: "Go live" }));
  });

  it("cancels adding a card", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    const todo = column("To do");
    await user.click(within(todo).getByRole("button", { name: "+ Add card" }));
    await user.click(within(todo).getByRole("button", { name: "Cancel" }));
    expect(within(todo).queryByLabelText("Card title")).not.toBeInTheDocument();
    expect(within(todo).getAllByTestId("card")).toHaveLength(2);
  });

  it("deletes a card and saves it", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    await user.click(screen.getByRole("button", { name: "Delete Brand color update" }));
    expect(screen.queryByText("Brand color update")).not.toBeInTheDocument();
    expect(within(column("Review")).getByText("Drop a card here")).toBeInTheDocument();
    await waitFor(() => expect(lastColumns()[3].cards).toEqual([]));
  });

  it("sends saves in order so the last change wins", async () => {
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    await user.click(screen.getByRole("button", { name: "Delete Domain renewal" }));
    await user.click(screen.getByRole("button", { name: "Delete Kickoff meeting" }));
    await waitFor(() => expect(patches()).toHaveLength(2));
    expect(lastColumns()[4].cards).toEqual([]);
    expect(screen.getByText("All changes saved")).toBeInTheDocument();
  });

  it("shows when a save fails", async () => {
    failSaves = true;
    const user = userEvent.setup();
    renderWithSWR(<Board board={board} />);
    await user.click(screen.getByRole("button", { name: "Delete Domain renewal" }));
    expect(await screen.findByText("Could not save changes")).toBeInTheDocument();
  });
});
