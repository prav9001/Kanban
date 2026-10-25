import { expect, type Locator, type Page } from "@playwright/test";

export const PASSWORD = "password123";

// Next keeps recently visited routes mounted but hidden, so test-id locators only match visible elements.
export const column = (page: Page, name: string) => page.getByRole("region", { name });
export const cards = (page: Page) => page.getByTestId("card").filter({ visible: true });
export const card = (page: Page, title: string) => cards(page).filter({ hasText: title });
export const tiles = (page: Page) => page.getByTestId("board-tile").filter({ visible: true });
export const tile = (page: Page, name: string) => tiles(page).filter({ hasText: name });
export const field = (page: Page, name: string) => page.getByLabel(name, { exact: true }).filter({ visible: true });

export const uniqueEmail = () => `user-${crypto.randomUUID()}@example.com`;

// Creates a fresh account through the API; the session cookie lands in the page's browser context.
export async function signUp(page: Page, name = "Test User") {
  const email = uniqueEmail();
  const res = await page.request.post("/api/auth/signup", { data: { name, email, password: PASSWORD } });
  expect(res.status()).toBe(201);
  return { name, email };
}

export async function openSampleBoard(page: Page) {
  await page.goto("/boards");
  await page.getByRole("link", { name: "Website relaunch" }).click();
  await expect(page.getByRole("region")).toHaveCount(5);
}

export async function waitForSave(page: Page) {
  await expect(page.getByText("All changes saved")).toBeVisible();
}

export async function drag(page: Page, source: Locator, target: Locator) {
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.mouse.up();
}
