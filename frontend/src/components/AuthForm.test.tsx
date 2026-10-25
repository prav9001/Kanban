import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockFetch, renderWithSWR } from "@/test/render";
import AuthForm from "./AuthForm";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => replace.mockReset());

describe("AuthForm", () => {
  it("signs in and goes to the boards page", async () => {
    const calls = mockFetch({ "POST /api/auth/login": () => [200, { id: "u1" }] });
    const user = userEvent.setup();
    renderWithSWR(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/boards"));
    expect(calls[0].body).toEqual({ email: "a@example.com", password: "secret" });
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
  });

  it("shows the server error and lets the user retry", async () => {
    mockFetch({ "POST /api/auth/login": () => [401, { error: "Incorrect email or password" }] });
    const user = userEvent.setup();
    renderWithSWR(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("creates an account with a name", async () => {
    const calls = mockFetch({ "POST /api/auth/signup": () => [201, { id: "u1" }] });
    const user = userEvent.setup();
    renderWithSWR(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText("Name"), "Alice");
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/boards"));
    expect(calls[0].body).toEqual({ name: "Alice", email: "a@example.com", password: "password123" });
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("falls back to a generic error when the response has no message", async () => {
    mockFetch({ "POST /api/auth/signup": () => [500] });
    const user = userEvent.setup();
    renderWithSWR(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText("Name"), "Alice");
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
