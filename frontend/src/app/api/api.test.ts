// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/server/db";
import { call, sessionCookie } from "@/test/api";
import * as signup from "./auth/signup/route";
import * as login from "./auth/login/route";
import * as logout from "./auth/logout/route";
import * as me from "./auth/me/route";
import * as password from "./auth/password/route";
import * as boards from "./boards/route";
import * as board from "./boards/[id]/route";

const alice = { name: "Alice", email: "alice@example.com", password: "password123" };

async function signUp(user = alice) {
  const res = await call(signup.POST, { body: user });
  return sessionCookie(res.cookie);
}

beforeEach(() => resetDb());

describe("auth", () => {
  it("signs up, sets an httpOnly session cookie and returns the user", async () => {
    const res = await call(signup.POST, { body: alice });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Alice", email: "alice@example.com" });
    expect(res.body.password_hash).toBeUndefined();
    expect(res.cookie).toMatch(/^session=\w+/);
    expect(res.cookie.toLowerCase()).toContain("httponly");
  });

  it("rejects invalid signup data", async () => {
    expect((await call(signup.POST, { body: { ...alice, email: "nope" } })).body.error).toBe("Enter a valid email");
    expect((await call(signup.POST, { body: { ...alice, password: "short" } })).body.error).toBe(
      "Password must be at least 8 characters",
    );
    expect((await call(signup.POST, { body: { ...alice, name: "  " } })).status).toBe(400);
    expect((await call(signup.POST, { body: "{bad json" })).status).toBe(400);
  });

  it("rejects a duplicate email regardless of case", async () => {
    await signUp();
    const res = await call(signup.POST, { body: { ...alice, email: "ALICE@example.com" } });
    expect(res.status).toBe(409);
  });

  it("logs in with the right password only", async () => {
    await signUp();
    const ok = await call(login.POST, { body: { email: "Alice@Example.com", password: alice.password } });
    expect(ok.status).toBe(200);
    expect(ok.cookie).toMatch(/^session=/);
    const bad = await call(login.POST, { body: { email: alice.email, password: "wrong-password" } });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toBe("Incorrect email or password");
    expect((await call(login.POST, { body: { email: "nobody@example.com", password: "x" } })).status).toBe(401);
    expect((await call(login.POST, { body: {} })).status).toBe(400);
  });

  it("returns the current user for a valid session and 401 otherwise", async () => {
    const cookie = await signUp();
    expect((await call(me.GET, { cookie })).body.email).toBe(alice.email);
    expect((await call(me.GET)).status).toBe(401);
    expect((await call(me.GET, { cookie: "session=forged" })).status).toBe(401);
  });

  it("logs out by ending the session", async () => {
    const cookie = await signUp();
    const res = await call(logout.POST, { cookie });
    expect(res.status).toBe(204);
    expect(res.cookie).toMatch(/^session=;/);
    expect((await call(me.GET, { cookie })).status).toBe(401);
    expect((await call(logout.POST)).status).toBe(204);
  });
});

describe("account", () => {
  it("updates the display name", async () => {
    const cookie = await signUp();
    const res = await call(me.PATCH, { cookie, body: { name: " Alice Liddell " } });
    expect(res.body.name).toBe("Alice Liddell");
    expect((await call(me.GET, { cookie })).body.name).toBe("Alice Liddell");
    expect((await call(me.PATCH, { cookie, body: { name: "" } })).body.error).toBe("Name is required");
  });

  it("changes the password and signs out other sessions", async () => {
    const cookie = await signUp();
    const other = sessionCookie((await call(login.POST, { body: alice })).cookie);
    const wrong = await call(password.POST, { cookie, body: { currentPassword: "nope", newPassword: "new-password" } });
    expect(wrong.status).toBe(403);
    expect(wrong.body.error).toBe("Current password is incorrect");
    const short = await call(password.POST, { cookie, body: { currentPassword: alice.password, newPassword: "x" } });
    expect(short.body.error).toBe("New password must be at least 8 characters");

    const ok = await call(password.POST, { cookie, body: { currentPassword: alice.password, newPassword: "new-password" } });
    expect(ok.status).toBe(204);
    expect((await call(me.GET, { cookie })).status).toBe(200);
    expect((await call(me.GET, { cookie: other })).status).toBe(401);
    expect((await call(login.POST, { body: alice })).status).toBe(401);
    expect((await call(login.POST, { body: { ...alice, password: "new-password" } })).status).toBe(200);
  });

  it("deletes the account and its boards only with the right password", async () => {
    const cookie = await signUp();
    const wrong = await call(me.DELETE, { cookie, body: { password: "nope" } });
    expect(wrong.status).toBe(403);
    expect((await call(me.DELETE, { cookie, body: {} })).status).toBe(400);

    const res = await call(me.DELETE, { cookie, body: { password: alice.password } });
    expect(res.status).toBe(204);
    expect(res.cookie).toMatch(/^session=;/);
    expect((await call(me.GET, { cookie })).status).toBe(401);
    expect((await call(login.POST, { body: alice })).status).toBe(401);
    const again = await call(signup.POST, { body: alice });
    expect(again.status).toBe(201);
    expect((await call(boards.GET, { cookie: sessionCookie(again.cookie) })).body).toHaveLength(1);
  });

  it("requires a session for account endpoints", async () => {
    const results = await Promise.all([
      call(me.PATCH, { body: { name: "X" } }),
      call(me.DELETE, { body: { password: "x" } }),
      call(password.POST, { body: { currentPassword: "x", newPassword: "yyyyyyyy" } }),
    ]);
    expect(results.map((r) => r.status)).toEqual([401, 401, 401]);
  });
});

describe("boards", () => {
  it("gives a new user a sample board", async () => {
    const cookie = await signUp();
    const res = await call(boards.GET, { cookie });
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: "Website relaunch", cardCount: 10 });
  });

  it("creates a board with five empty columns and lists newest first", async () => {
    const cookie = await signUp();
    const created = await call(boards.POST, { cookie, body: { name: "  Q3 roadmap " } });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe("Q3 roadmap");
    expect(created.body.columns.map((c: { title: string }) => c.title)).toEqual([
      "Backlog",
      "To do",
      "In progress",
      "Review",
      "Done",
    ]);
    const list = await call(boards.GET, { cookie });
    expect(list.body.map((b: { name: string }) => b.name)).toEqual(["Q3 roadmap", "Website relaunch"]);
    expect((await call(boards.POST, { cookie, body: { name: "" } })).body.error).toBe("Board name is required");
  });

  it("gets, renames, saves columns and deletes a board", async () => {
    const cookie = await signUp();
    const { body: created } = await call(boards.POST, { cookie, body: { name: "Ops" } });
    const id = created.id;

    expect((await call(board.GET, { cookie, id })).body.name).toBe("Ops");

    const renamed = await call(board.PATCH, { cookie, id, body: { name: "Operations" } });
    expect(renamed.body.name).toBe("Operations");

    const columns = [{ id: "c1", title: "Only", cards: [{ id: "k1", title: "Task", details: "" }] }];
    const saved = await call(board.PATCH, { cookie, id, body: { columns } });
    expect(saved.body).toMatchObject({ name: "Operations", columns });
    expect((await call(board.GET, { cookie, id })).body.columns).toEqual(columns);

    expect((await call(board.DELETE, { cookie, id })).status).toBe(204);
    expect((await call(board.GET, { cookie, id })).status).toBe(404);
    expect((await call(board.DELETE, { cookie, id })).status).toBe(404);
  });

  it("rejects malformed updates", async () => {
    const cookie = await signUp();
    const { body: created } = await call(boards.POST, { cookie, body: { name: "Ops" } });
    const id = created.id;
    expect((await call(board.PATCH, { cookie, id, body: {} })).body.error).toBe("Nothing to update");
    expect((await call(board.PATCH, { cookie, id, body: { columns: [] } })).status).toBe(400);
    const badCard = [{ id: "c", title: "C", cards: [{ id: "k", title: "", details: "" }] }];
    expect((await call(board.PATCH, { cookie, id, body: { columns: badCard } })).status).toBe(400);
  });

  it("keeps each user's boards private", async () => {
    const aliceCookie = await signUp();
    const bobCookie = await signUp({ name: "Bob", email: "bob@example.com", password: "password456" });
    const { body: aliceBoards } = await call(boards.GET, { cookie: aliceCookie });
    const id = aliceBoards[0].id;

    expect((await call(boards.GET, { cookie: bobCookie })).body.map((b: { id: string }) => b.id)).not.toContain(id);
    expect((await call(board.GET, { cookie: bobCookie, id })).status).toBe(404);
    expect((await call(board.PATCH, { cookie: bobCookie, id, body: { name: "Hacked" } })).status).toBe(404);
    expect((await call(board.DELETE, { cookie: bobCookie, id })).status).toBe(404);
    expect((await call(board.GET, { cookie: aliceCookie, id })).body.name).toBe("Website relaunch");
  });

  it("requires a session for every board endpoint", async () => {
    const results = await Promise.all([
      call(boards.GET),
      call(boards.POST, { body: { name: "X" } }),
      call(board.GET, { id: "x" }),
      call(board.PATCH, { id: "x", body: { name: "X" } }),
      call(board.DELETE, { id: "x" }),
    ]);
    expect(results.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
  });
});
