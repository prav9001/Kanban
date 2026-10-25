import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import type { User } from "@/lib/user";
import { getDb } from "./db";

export type { User };
export { SESSION_COOKIE };
export const SESSION_DAYS = 30;

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scryptAsync(password, salt, 64)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(await scryptAsync(password, salt, 64), Buffer.from(hash, "hex"));
}

// Returns null when the email is already registered.
export async function createUser(email: string, name: string, password: string): Promise<User | null> {
  const user = { id: randomUUID(), email: email.toLowerCase(), name };
  const hash = await hashPassword(password);
  try {
    getDb()
      .prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(user.id, user.email, user.name, hash, Date.now());
  } catch (e) {
    if (String(e).includes("UNIQUE")) return null;
    throw e;
  }
  return user;
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const row = getDb()
    .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .get(email.toLowerCase()) as (User & { password_hash: string }) | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash))) return null;
  return { id: row.id, email: row.email, name: row.name };
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  getDb()
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, Date.now() + SESSION_DAYS * 86_400_000);
  return token;
}

export function getSessionUser(token: string | undefined): User | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      "SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?",
    )
    .get(token, Date.now()) as User | undefined;
  return row ? { ...row } : null;
}

export function deleteSession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function currentUser(req: NextRequest) {
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
}

async function passwordMatches(userId: string, password: string) {
  const row = getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(userId) as { password_hash: string };
  return verifyPassword(password, row.password_hash);
}

export function renameUser(userId: string, name: string) {
  getDb().prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
}

// Changing the password signs out every other session.
export async function changePassword(userId: string, current: string, next: string, keepToken: string) {
  if (!(await passwordMatches(userId, current))) return false;
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(next), userId);
  getDb().prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(userId, keepToken);
  return true;
}

export async function deleteUser(userId: string, password: string) {
  if (!(await passwordMatches(userId, password))) return false;
  getDb().prepare("DELETE FROM users WHERE id = ?").run(userId);
  return true;
}
