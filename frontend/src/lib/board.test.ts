import { describe, expect, it } from "vitest";
import { addCard, deleteCard, findColumn, initialColumns, loadColumns, moveCard, renameColumn, saveColumns } from "./board";

const ids = (cols = initialColumns, i = 0) => cols[i].cards.map((c) => c.id);

describe("initialColumns", () => {
  it("has five columns with dummy cards", () => {
    expect(initialColumns).toHaveLength(5);
    expect(initialColumns.every((c) => c.cards.length > 0)).toBe(true);
  });
});

describe("renameColumn", () => {
  it("renames only the target column", () => {
    const cols = renameColumn(initialColumns, "col-todo", "Next up");
    expect(cols[1].title).toBe("Next up");
    expect(cols[0].title).toBe("Backlog");
    expect(initialColumns[1].title).toBe("To do");
  });
});

describe("addCard", () => {
  it("appends a card to the target column", () => {
    const card = { id: "new", title: "New", details: "" };
    const cols = addCard(initialColumns, "col-done", card);
    expect(cols[4].cards.at(-1)).toEqual(card);
    expect(cols[4].cards).toHaveLength(initialColumns[4].cards.length + 1);
  });
});

describe("deleteCard", () => {
  it("removes the card from its column", () => {
    const cols = deleteCard(initialColumns, "card-2");
    expect(ids(cols)).toEqual(["card-1", "card-3"]);
  });
});

describe("findColumn", () => {
  it("finds a column by its id or by a card id", () => {
    expect(findColumn(initialColumns, "col-review")?.id).toBe("col-review");
    expect(findColumn(initialColumns, "card-6")?.id).toBe("col-progress");
    expect(findColumn(initialColumns, "nope")).toBeUndefined();
  });
});

describe("moveCard", () => {
  it("reorders within a column", () => {
    expect(ids(moveCard(initialColumns, "card-1", "col-backlog", 2))).toEqual(["card-2", "card-3", "card-1"]);
    expect(ids(moveCard(initialColumns, "card-3", "col-backlog", 0))).toEqual(["card-3", "card-1", "card-2"]);
  });

  it("moves across columns at a given index", () => {
    const cols = moveCard(initialColumns, "card-1", "col-review", 0);
    expect(ids(cols)).toEqual(["card-2", "card-3"]);
    expect(ids(cols, 3)).toEqual(["card-1", "card-8"]);
  });

  it("moves into an empty column", () => {
    const empty = initialColumns.map((c) => (c.id === "col-review" ? { ...c, cards: [] } : c));
    expect(ids(moveCard(empty, "card-9", "col-review", 0), 3)).toEqual(["card-9"]);
  });
});

describe("loadColumns / saveColumns", () => {
  it("returns the dummy board when nothing is saved", () => {
    expect(loadColumns()).toEqual(initialColumns);
  });

  it("returns the saved board", () => {
    const cols = renameColumn(initialColumns, "col-done", "Shipped");
    saveColumns(cols);
    expect(loadColumns()).toEqual(cols);
  });
});
