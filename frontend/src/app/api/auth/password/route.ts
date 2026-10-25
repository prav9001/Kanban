import type { NextRequest } from "next/server";
import { SESSION_COOKIE, changePassword } from "@/lib/server/auth";
import { error, parseBody, requireUser } from "@/lib/server/http";
import { passwordSchema } from "@/lib/server/schemas";

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, passwordSchema);
  if (body.response) return body.response;
  const { currentPassword, newPassword } = body.data;
  if (!(await changePassword(auth.user.id, currentPassword, newPassword, req.cookies.get(SESSION_COOKIE)!.value))) {
    return error("Current password is incorrect", 403);
  }
  return new Response(null, { status: 204 });
}
