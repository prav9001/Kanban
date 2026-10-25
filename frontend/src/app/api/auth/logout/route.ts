import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, deleteSession } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
