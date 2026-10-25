import { NextRequest } from "next/server";

type Handler = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response> | Response;

export async function call(handler: Handler, opts: { body?: unknown; cookie?: string; id?: string } = {}) {
  const req = new NextRequest("http://localhost/api", {
    method: "POST",
    body: opts.body === undefined ? undefined : typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body),
    headers: opts.cookie ? { cookie: opts.cookie } : {},
  });
  const res = await handler(req, { params: Promise.resolve({ id: opts.id ?? "" }) });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, cookie: res.headers.get("set-cookie") ?? "" };
}

export const sessionCookie = (setCookie: string) => setCookie.split(";")[0];
