import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, deleteUser, renameUser } from "@/lib/server/auth";
import { error, parseBody, requireUser } from "@/lib/server/http";
import { deleteAccountSchema, profileSchema } from "@/lib/server/schemas";

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  return auth.response ?? Response.json(auth.user);
}

export async function PATCH(req: NextRequest) {
  const auth = requireUser(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, profileSchema);
  if (body.response) return body.response;
  renameUser(auth.user.id, body.data.name);
  return Response.json({ ...auth.user, name: body.data.name });
}

export async function DELETE(req: NextRequest) {
  const auth = requireUser(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, deleteAccountSchema);
  if (body.response) return body.response;
  if (!(await deleteUser(auth.user.id, body.data.password))) return error("Incorrect password", 403);
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
