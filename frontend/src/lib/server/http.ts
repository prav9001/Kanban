import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { SESSION_COOKIE, SESSION_DAYS, currentUser, type User } from "./auth";

export const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function parseBody<T extends z.ZodType>(req: NextRequest, schema: T) {
  const result = schema.safeParse(await req.json().catch(() => undefined));
  return result.success
    ? { data: result.data as z.infer<T> }
    : { response: error(result.error.issues[0].message, 400) };
}

export function withSession(user: User, token: string, status = 200) {
  const res = NextResponse.json(user, { status });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return res;
}

export function requireUser(req: NextRequest) {
  const user = currentUser(req);
  return user ? { user } : { response: error("Not signed in", 401) };
}
