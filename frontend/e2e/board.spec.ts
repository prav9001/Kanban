import { expect, test } from "@playwright/test";
import { card, cards, column, drag, openSampleBoard, signUp, waitForSave } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
  await openSampleBoard(page);
});

test("loads the sample board with five columns and dummy cards", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Website relaunch" })).toBeVisible();
  await expect(page.getByRole("region")).toHaveCount(5);
  await expect(cards(page)).toHaveCount(10);
  for (const name of ["Backlog", "To do", "In progress", "Review", "Done"]) {
    await expect(column(page, name)).toBeVisible();
  }
});

test("renames a column", async ({ page }) => {
  await page.getByRole("button", { name: "In progress" }).click();
  await page.getByLabel("Column name").fill("Doing");
  await page.getByLabel("Column name").press("Enter");
  await expect(column(page, "Doing")).toBeVisible();
  await expect(column(page, "In progress")).toHaveCount(0);
});

test("adds a card", async ({ page }) => {
  const backlog = column(page, "Backlog");
  await backlog.getByRole("button", { name: "+ Add card" }).click();
  await backlog.getByLabel("Card title").fill("Plan launch party");
  await backlog.getByLabel("Card details").fill("Book a venue");
  await backlog.getByRole("button", { name: "Add card", exact: true }).click();
  await expect(backlog.getByTestId("card")).toHaveCount(4);
  await expect(backlog.getByTestId("card").last()).toContainText("Plan launch party");
  await expect(page.getByText("11 cards across 5 stages")).toBeVisible();
});

test("deletes a card", async ({ page }) => {
  await card(page, "Domain renewal").hover();
  await page.getByRole("button", { name: "Delete Domain renewal" }).click();
  await expect(card(page, "Domain renewal")).toHaveCount(0);
  await expect(column(page, "Done").getByTestId("card")).toHaveCount(1);
});

test("drags a card to another column", async ({ page }) => {
  await drag(page, card(page, "Write homepage copy"), card(page, "Brand color update"));
  await expect(column(page, "Review").getByTestId("card")).toHaveCount(2);
  await expect(column(page, "Review")).toContainText("Write homepage copy");
  await expect(column(page, "To do").getByTestId("card")).toHaveCount(1);
});

test("drags a card into an empty column", async ({ page }) => {
  await card(page, "Brand color update").hover();
  await page.getByRole("button", { name: "Delete Brand color update" }).click();
  const review = column(page, "Review");
  await expect(review.getByText("Drop a card here")).toBeVisible();
  await drag(page, card(page, "Kickoff meeting"), review.getByText("Drop a card here"));
  await expect(review.getByTestId("card")).toHaveCount(1);
  await expect(review).toContainText("Kickoff meeting");
});

test("reorders cards within a column", async ({ page }) => {
  const backlog = column(page, "Backlog");
  await drag(page, card(page, "Audit current site content"), card(page, "Pick analytics tool"));
  await expect(backlog.getByTestId("card").last()).toContainText("Audit current site content");
  await expect(backlog.getByTestId("card")).toHaveCount(3);
});

test("rename survives a drag", async ({ page }) => {
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByLabel("Column name").fill("Shipped");
  await page.getByLabel("Column name").press("Enter");
  await drag(page, card(page, "Collect customer quotes"), card(page, "Kickoff meeting"));
  await expect(column(page, "Shipped")).toContainText("Collect customer quotes");
});

test("moves a card with the keyboard", async ({ page }) => {
  const live = page.locator("[aria-live]").first();
  await page.getByRole("button", { name: /^Kickoff meeting/ }).focus();
  await page.keyboard.press("Space");
  await expect(live).toContainText("Kickoff meeting is in Done.");
  await page.keyboard.press("ArrowDown");
  await expect(live).toContainText("Kickoff meeting is over Domain renewal in Done.");
  await page.keyboard.press("Space");
  await expect(live).toContainText("Kickoff meeting was dropped in Done.");
  await expect(column(page, "Done").getByTestId("card").last()).toContainText("Kickoff meeting");
});

test("cancelling a drag with Escape puts the card back", async ({ page }) => {
  const from = (await card(page, "Write homepage copy").boundingBox())!;
  const to = (await card(page, "Brand color update").boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await expect(column(page, "Review")).toContainText("Write homepage copy");
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(column(page, "To do")).toContainText("Write homepage copy");
  await expect(column(page, "Review").getByTestId("card")).toHaveCount(1);
  await expect(page.locator("[aria-live]").first()).toContainText("Write homepage copy was returned to its place.");
});

test("wraps long titles and keeps line breaks in details", async ({ page }) => {
  const backlog = column(page, "Backlog");
  await backlog.getByRole("button", { name: "+ Add card" }).click();
  await backlog.getByLabel("Card title").fill("https://example.com/" + "x".repeat(80));
  await backlog.getByLabel("Card details").fill("First line\nSecond line");
  await backlog.getByRole("button", { name: "Add card", exact: true }).click();
  const added = card(page, "First line");
  const title = added.locator("h3");
  expect(await title.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  expect(await added.locator("p").innerText()).toBe("First line\nSecond line");
});

test("lays out without horizontal scroll on a laptop screen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const doneBox = (await column(page, "Done").boundingBox())!;
  expect(doneBox.x + doneBox.width).toBeLessThanOrEqual(1280 - 24);
});

test("keeps changes after a reload", async ({ page }) => {
  await drag(page, card(page, "Write homepage copy"), card(page, "Brand color update"));
  await page.getByRole("button", { name: "Backlog" }).click();
  await page.getByLabel("Column name").fill("Ideas");
  await page.getByLabel("Column name").press("Enter");
  await card(page, "Domain renewal").hover();
  await page.getByRole("button", { name: "Delete Domain renewal" }).click();
  const todo = column(page, "To do");
  await todo.getByRole("button", { name: "+ Add card" }).click();
  await todo.getByLabel("Card title").fill("Saved card");
  await todo.getByRole("button", { name: "Add card", exact: true }).click();
  await expect(todo).toContainText("Saved card");
  await waitForSave(page);

  await page.reload();

  await expect(column(page, "Ideas")).toBeVisible();
  await expect(column(page, "Review")).toContainText("Write homepage copy");
  await expect(card(page, "Domain renewal")).toHaveCount(0);
  await expect(todo).toContainText("Saved card");
  await expect(cards(page)).toHaveCount(10);
});
