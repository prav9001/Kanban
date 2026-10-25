import { expect, test } from "@playwright/test";
import { PASSWORD, field, signUp, uniqueEmail } from "./helpers";

test("redirects signed-out visitors to the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/boards");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("signs up through the form and lands on a sample board", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Create an account" }).click();
  await field(page, "Name").fill("Dana Scully");
  await field(page, "Email").fill(uniqueEmail());
  await field(page, "Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/boards$/);
  await expect(page.getByRole("heading", { name: "Your boards" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dana Scully" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Website relaunch" })).toBeVisible();
});

test("rejects a duplicate email on sign up", async ({ page }) => {
  const { email } = await signUp(page);
  await page.context().clearCookies();
  await page.goto("/signup");
  await field(page, "Name").fill("Copycat");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account with this email already exists")).toBeVisible();
});

test("signs out and signs back in", async ({ page }) => {
  const { email, name } = await signUp(page);
  await page.goto("/boards");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/boards");
  await expect(page).toHaveURL(/\/login$/);

  await field(page, "Email").fill(email);
  await field(page, "Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect email or password")).toBeVisible();

  await field(page, "Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/boards$/);
  await expect(page.getByRole("link", { name })).toBeVisible();
});

test("an expired or forged session is sent back to login", async ({ page, context }) => {
  await context.addCookies([{ name: "session", value: "forged", url: "http://localhost:3100" }]);
  await page.goto("/boards");
  await expect(page).toHaveURL(/\/login$/);
});
