import { expect, test } from "@playwright/test";
import { card, cards, column, field, signUp, tile, tiles, waitForSave } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
  await page.goto("/boards");
});

test("creates a board with five empty columns", async ({ page }) => {
  await field(page, "New board name").fill("Q3 roadmap");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByRole("heading", { name: "Q3 roadmap" })).toBeVisible();
  await expect(page.getByRole("region")).toHaveCount(5);
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByText("0 cards across 5 stages")).toBeVisible();

  await page.getByRole("link", { name: /All boards/ }).click();
  await expect(tiles(page)).toHaveCount(2);
  await expect(page.getByText("2 boards")).toBeVisible();
});

test("keeps boards separate from each other", async ({ page }) => {
  await field(page, "New board name").fill("Hiring");
  await page.getByRole("button", { name: "Create board" }).click();
  const backlog = column(page, "Backlog");
  await backlog.getByRole("button", { name: "+ Add card" }).click();
  await backlog.getByLabel("Card title").fill("Post the job ad");
  await backlog.getByRole("button", { name: "Add card", exact: true }).click();
  await waitForSave(page);

  await page.getByRole("link", { name: /All boards/ }).click();
  await expect(tile(page, "Hiring")).toContainText("1 card");
  await expect(tile(page, "Website relaunch")).toContainText("10 cards");
  await page.getByRole("link", { name: "Website relaunch" }).click();
  await expect(card(page, "Post the job ad")).toHaveCount(0);
  await page.getByRole("link", { name: /All boards/ }).click();
  await page.getByRole("link", { name: "Hiring" }).click();
  await expect(card(page, "Post the job ad")).toBeVisible();
});

test("renames a board from the list and from the board", async ({ page }) => {
  await tile(page, "Website relaunch").hover();
  await page.getByRole("button", { name: "Rename Website relaunch" }).click();
  await field(page, "Board name").fill("Site refresh");
  await field(page, "Board name").press("Enter");
  await expect(page.getByRole("link", { name: "Site refresh" })).toBeVisible();

  await page.getByRole("link", { name: "Site refresh" }).click();
  await page.getByRole("button", { name: "Site refresh", exact: true }).click();
  await field(page, "Board name").fill("Site refresh 2026");
  await field(page, "Board name").press("Enter");
  await waitForSave(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Site refresh 2026" })).toBeVisible();
});

test("deletes a board after confirming", async ({ page }) => {
  await tile(page, "Website relaunch").hover();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Delete Website relaunch" }).click();
  await expect(tile(page, "Website relaunch")).toHaveCount(1);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete Website relaunch" }).click();
  await expect(page.getByText("No boards yet. Create one to get started.")).toBeVisible();
  await page.reload();
  await expect(tiles(page)).toHaveCount(0);
});

test("shows a not found page for a board that does not exist", async ({ page }) => {
  await page.goto("/boards/does-not-exist");
  await expect(page.getByRole("heading", { name: "Board not found" })).toBeVisible();
  await page.getByRole("link", { name: "Back to your boards" }).click();
  await expect(page.getByRole("heading", { name: "Your boards" })).toBeVisible();
});

test("one user cannot open another user's board", async ({ page, browser }) => {
  await page.getByRole("link", { name: "Website relaunch" }).click();
  await expect(page.getByRole("region")).toHaveCount(5);
  const url = page.url();

  const other = await browser.newPage({ baseURL: "http://localhost:3100" });
  await signUp(other, "Mallory");
  await other.goto(url);
  await expect(other.getByRole("heading", { name: "Board not found" })).toBeVisible();
  await other.close();
});
