// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_DAYS, createSession, createUser, getSessionUser, hashPassword, verifyPassword } from "./auth";
import { getDb, resetDb } from "./db";

beforeEach(() => resetDb());
afterEach(() => vi.useRealTimers());

describe("passwords", () => {
  it("hashes with a random salt and verifies", async () => {
    const a = await hashPassword("secret-password");
    const b = await hashPassword("secret-password");
    expect(a).not.toBe(b);
    expect(a).not.toContain("secret-password");
    expect(await verifyPassword("secret-password", a)).toBe(true);
    expect(await verifyPassword("wrong-password", a)).toBe(false);
  });
});

describe("sessions", () => {
  it("expires sessions and removes expired ones when a new session starts", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const user = (await createUser("a@example.com", "A", "password123"))!;
    const token = createSession(user.id);
    expect(getSessionUser(token)).toEqual(user);

    vi.setSystemTime(Date.now() + SESSION_DAYS * 86_400_000 + 1);
    expect(getSessionUser(token)).toBeNull();
    createSession(user.id);
    expect(getDb().prepare("SELECT count(*) AS n FROM sessions").get()).toEqual({ n: 1 });
  });

  it("returns null for a missing token", () => {
    expect(getSessionUser(undefined)).toBeNull();
  });
});
