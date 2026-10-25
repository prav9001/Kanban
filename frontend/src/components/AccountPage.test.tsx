import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockFetch, renderWithSWR } from "@/test/render";
import AccountPage from "./AccountPage";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

let calls: ReturnType<typeof mockFetch>;
let name: string;

beforeEach(() => {
  replace.mockReset();
  name = "Alice";
  calls = mockFetch({
    "GET /api/auth/me": () => [200, { id: "u1", name, email: "alice@example.com" }],
    "PATCH /api/auth/me": (body) => {
      name = (body as { name: string }).name;
      return [200, { id: "u1", name, email: "alice@example.com" }];
    },
    "POST /api/auth/password": (body) =>
      (body as { currentPassword: string }).currentPassword === "right-password"
        ? [204]
        : [403, { error: "Current password is incorrect" }],
    "DELETE /api/auth/me": (body) =>
      (body as { password: string }).password === "right-password" ? [204] : [403, { error: "Incorrect password" }],
  });
});

const section = (name: string) => screen.getByRole("region", { name });

describe("AccountPage", () => {
  it("shows the account email and current name", async () => {
    renderWithSWR(<AccountPage />);
    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(within(section("Profile")).getByLabelText("Name")).toHaveValue("Alice");
  });

  it("updates the name everywhere", async () => {
    const user = userEvent.setup();
    renderWithSWR(<AccountPage />);
    const input = await within(section("Profile")).findByLabelText("Name");
    await user.clear(input);
    await user.type(input, "Alice Liddell");
    await user.click(screen.getByRole("button", { name: "Save name" }));
    expect(await screen.findByText("Name updated")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alice Liddell" })).toBeInTheDocument();
    expect(within(section("Profile")).getByLabelText("Name")).toHaveValue("Alice Liddell");
  });

  it("changes the password and reports a wrong current password", async () => {
    const user = userEvent.setup();
    renderWithSWR(<AccountPage />);
    const form = section("Change password");
    await user.type(within(form).getByLabelText("Current password"), "wrong");
    await user.type(within(form).getByLabelText("New password"), "new-password");
    await user.click(within(form).getByRole("button", { name: "Change password" }));
    expect(await within(form).findByRole("alert")).toHaveTextContent("Current password is incorrect");

    await user.clear(within(form).getByLabelText("Current password"));
    await user.type(within(form).getByLabelText("Current password"), "right-password");
    await user.clear(within(form).getByLabelText("New password"));
    await user.type(within(form).getByLabelText("New password"), "new-password");
    await user.click(within(form).getByRole("button", { name: "Change password" }));
    expect(await within(form).findByText("Password changed. Other devices have been signed out.")).toBeInTheDocument();
    expect(within(form).getByLabelText("Current password")).toHaveValue("");
  });

  it("deletes the account only after confirming with the right password", async () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    vi.stubGlobal("confirm", confirm);
    const user = userEvent.setup();
    renderWithSWR(<AccountPage />);
    const form = section("Delete account");
    const deletes = () => calls.filter((c) => c.key === "DELETE /api/auth/me");

    await user.type(within(form).getByLabelText("Confirm with your password"), "wrong");
    await user.click(within(form).getByRole("button", { name: "Delete account" }));
    expect(deletes()).toHaveLength(0);

    await user.type(within(form).getByLabelText("Confirm with your password"), "wrong");
    await user.click(within(form).getByRole("button", { name: "Delete account" }));
    expect(await within(form).findByRole("alert")).toHaveTextContent("Incorrect password");

    await user.clear(within(form).getByLabelText("Confirm with your password"));
    await user.type(within(form).getByLabelText("Confirm with your password"), "right-password");
    await user.click(within(form).getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/signup"));
    expect(deletes().at(-1)!.body).toEqual({ password: "right-password" });
  });
});
