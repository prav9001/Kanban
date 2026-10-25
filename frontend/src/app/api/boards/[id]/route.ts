import type { NextRequest } from "next/server";
import { deleteBoard, getBoard, updateBoard } from "@/lib/server/boards";
import { error, parseBody, requireUser } from "@/lib/server/http";
import { boardUpdateSchema } from "@/lib/server/schemas";

type Ctx = RouteContext<"/api/boards/[id]">;

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = requireUser(req);
  if (auth.response) return auth.response;
  const board = getBoard(auth.user.id, (await ctx.params).id);
  return board ? Response.json(board) : error("Board not found", 404);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = requireUser(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, boardUpdateSchema);
  if (body.response) return body.response;
  const board = updateBoard(auth.user.id, (await ctx.params).id, body.data);
  return board ? Response.json(board) : error("Board not found", 404);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireUser(req);
  if (auth.response) return auth.response;
  return deleteBoard(auth.user.id, (await ctx.params).id) ? new Response(null, { status: 204 }) : error("Board not found", 404);
}
