import { expect, test } from "@playwright/test";
import { PASSWORD, field, signUp } from "./helpers";

test("updates the display name", async ({ page }) => {
  await signUp(page, "Old Name");
  await page.goto("/boards");
  await page.getByRole("link", { name: "Old Name" }).click();
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await field(page, "Name").fill("New Name");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByText("Name updated")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "New Name" })).toBeVisible();
});

test("changes the password and signs out other browsers", async ({ page, browser }) => {
  const { email } = await signUp(page);
  const other = await browser.newPage({ baseURL: "http://localhost:3100" });
  await other.goto("/login");
  await field(other, "Email").fill(email);
  await field(other, "Password").fill(PASSWORD);
  await other.getByRole("button", { name: "Sign in" }).click();
  await expect(other.getByRole("heading", { name: "Your boards" })).toBeVisible();

  await page.goto("/account");
  await field(page, "Current password").fill(PASSWORD);
  await field(page, "New password").fill("brand-new-password");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed. Other devices have been signed out.")).toBeVisible();

  await other.reload();
  await expect(other).toHaveURL(/\/login$/);
  await field(other, "Email").fill(email);
  await field(other, "Password").fill("brand-new-password");
  await other.getByRole("button", { name: "Sign in" }).click();
  await expect(other.getByRole("heading", { name: "Your boards" })).toBeVisible();
  await other.close();
});

test("deletes the account", async ({ page }) => {
  const { email } = await signUp(page);
  await page.goto("/account");
  await field(page, "Confirm with your password").fill(PASSWORD);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete account" }).click();
  await expect(page).toHaveURL(/\/signup$/);

  await page.goto("/login");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect email or password")).toBeVisible();
});
