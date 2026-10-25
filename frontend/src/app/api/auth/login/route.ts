import type { NextRequest } from "next/server";
import { authenticate, createSession } from "@/lib/server/auth";
import { error, parseBody, withSession } from "@/lib/server/http";
import { loginSchema } from "@/lib/server/schemas";

export async function POST(req: NextRequest) {
  const body = await parseBody(req, loginSchema);
  if (body.response) return body.response;
  const user = await authenticate(body.data.email, body.data.password);
  if (!user) return error("Incorrect email or password", 401);
  return withSession(user, createSession(user.id));
}
