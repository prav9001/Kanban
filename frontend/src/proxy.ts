import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function proxy(req: NextRequest) {
  if (!req.cookies.has(SESSION_COOKIE)) return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/boards/:path*", "/account"] };
