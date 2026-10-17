import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Board from "./Board";

const column = (name: string) => screen.getByRole("region", { name });

describe("Board", () => {
  it("renders five columns with dummy cards", () => {
    render(<Board />);
    expect(screen.getAllByTestId("column")).toHaveLength(5);
    expect(screen.getByText("Write homepage copy")).toBeInTheDocument();
    expect(screen.getByText("10 cards across 5 stages")).toBeInTheDocument();
  });

  it("renames a column with Enter", async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(screen.getByRole("button", { name: "Backlog" }));
    const input = screen.getByLabelText("Column name");
    await user.clear(input);
    await user.type(input, "Ideas{Enter}");
    expect(column("Ideas")).toBeInTheDocument();
  });

  it("cancels rename with Escape and ignores empty names", async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(screen.getByRole("button", { name: "Review" }));
    await user.type(screen.getByLabelText("Column name"), "xyz{Escape}");
    expect(column("Review")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Review" }));
    await user.clear(screen.getByLabelText("Column name"));
    await user.keyboard("{Enter}");
    expect(column("Review")).toBeInTheDocument();
  });

  it("adds a card to a column", async () => {
    const user = userEvent.setup();
    render(<Board />);
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
  });

  it("cancels adding a card", async () => {
    const user = userEvent.setup();
    render(<Board />);
    const todo = column("To do");
    await user.click(within(todo).getByRole("button", { name: "+ Add card" }));
    await user.click(within(todo).getByRole("button", { name: "Cancel" }));
    expect(within(todo).queryByLabelText("Card title")).not.toBeInTheDocument();
    expect(within(todo).getAllByTestId("card")).toHaveLength(2);
  });

  it("deletes a card", async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(screen.getByRole("button", { name: "Delete Brand color update" }));
    expect(screen.queryByText("Brand color update")).not.toBeInTheDocument();
    expect(within(column("Review")).getByText("Drop a card here")).toBeInTheDocument();
  });
});
