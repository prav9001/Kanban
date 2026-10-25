import type { NextRequest } from "next/server";
import { initialColumns } from "@/lib/board";
import { createSession, createUser } from "@/lib/server/auth";
import { createBoard } from "@/lib/server/boards";
import { error, parseBody, withSession } from "@/lib/server/http";
import { signupSchema } from "@/lib/server/schemas";

export async function POST(req: NextRequest) {
  const body = await parseBody(req, signupSchema);
  if (body.response) return body.response;
  const { name, email, password } = body.data;
  const user = await createUser(email, name, password);
  if (!user) return error("An account with this email already exists", 409);
  createBoard(user.id, "Website relaunch", initialColumns);
  return withSession(user, createSession(user.id), 201);
}
