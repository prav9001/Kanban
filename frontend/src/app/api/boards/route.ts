import type { NextRequest } from "next/server";
import { emptyColumns } from "@/lib/board";
import { createBoard, listBoards } from "@/lib/server/boards";
import { parseBody, requireUser } from "@/lib/server/http";
import { boardCreateSchema } from "@/lib/server/schemas";

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  return auth.response ?? Response.json(listBoards(auth.user.id));
}

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, boardCreateSchema);
  if (body.response) return body.response;
  return Response.json(createBoard(auth.user.id, body.data.name, emptyColumns()), { status: 201 });
}
