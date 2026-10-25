import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch } from "@/test/render";
import { api, ApiError } from "./api";

const assign = vi.fn();

beforeEach(() => {
  assign.mockReset();
  vi.stubGlobal("location", { pathname: "/boards", assign });
});

describe("api", () => {
  it("sends JSON and parses the response", async () => {
    const calls = mockFetch({ "POST /api/x": (body) => [200, { echo: body }] });
    expect(await api("/api/x", { method: "POST", body: { a: 1 } })).toEqual({ echo: { a: 1 } });
    expect(calls).toEqual([{ key: "POST /api/x", body: { a: 1 } }]);
  });

  it("returns undefined for 204 responses", async () => {
    mockFetch({ "DELETE /api/x": () => [204] });
    expect(await api("/api/x", { method: "DELETE" })).toBeUndefined();
  });

  it("throws an ApiError with the server message and status", async () => {
    mockFetch({ "GET /api/x": () => [404, { error: "Board not found" }] });
    const err = await api("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: "Board not found", status: 404 });
  });

  it("sends signed-out users to the login page", async () => {
    mockFetch({ "GET /api/x": () => [401, { error: "Not signed in" }] });
    await expect(api("/api/x")).rejects.toThrow("Not signed in");
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("stays on the login page when sign in fails", async () => {
    vi.stubGlobal("location", { pathname: "/login", assign });
    mockFetch({ "POST /api/auth/login": () => [401, { error: "Incorrect email or password" }] });
    await expect(api("/api/auth/login", { method: "POST", body: {} })).rejects.toThrow("Incorrect email or password");
    expect(assign).not.toHaveBeenCalled();
  });
});
