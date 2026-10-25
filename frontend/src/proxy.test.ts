// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

const request = (cookie?: string) =>
  new NextRequest("http://localhost/boards/abc", { headers: cookie ? { cookie } : {} });

describe("proxy", () => {
  it("redirects visitors without a session cookie to login", () => {
    const res = proxy(request())!;
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("lets requests with a session cookie through", () => {
    expect(proxy(request("session=abc"))).toBeUndefined();
  });

  it("only guards app pages", () => {
    expect(config.matcher).toEqual(["/boards/:path*", "/account"]);
  });
});
