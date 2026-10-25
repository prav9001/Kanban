import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockFetch, renderWithSWR } from "@/test/render";
import AppHeader from "./AppHeader";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

describe("AppHeader", () => {
  it("shows the user and signs out", async () => {
    const calls = mockFetch({
      "GET /api/auth/me": () => [200, { id: "u1", name: "Alice", email: "a@example.com" }],
      "POST /api/auth/logout": () => [204],
    });
    const user = userEvent.setup();
    renderWithSWR(<AppHeader>Title</AppHeader>);
    expect(screen.getByRole("link", { name: "Kanban" })).toHaveAttribute("href", "/boards");
    expect(await screen.findByRole("link", { name: "Alice" })).toHaveAttribute("href", "/account");
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(calls.map((c) => c.key)).toContain("POST /api/auth/logout");
  });

  it("links back to all boards", () => {
    mockFetch({ "GET /api/auth/me": () => [200, { id: "u1", name: "Alice", email: "a@example.com" }] });
    renderWithSWR(<AppHeader back>Title</AppHeader>);
    expect(screen.getByRole("link", { name: /All boards/ })).toHaveAttribute("href", "/boards");
  });
});
