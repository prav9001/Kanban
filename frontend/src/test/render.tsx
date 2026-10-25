import { render } from "@testing-library/react";
import { SWRConfig } from "swr";
import { vi } from "vitest";

// Pass the same cache to several renders to simulate navigating away and back.
export function renderWithSWR(ui: React.ReactElement, cache = new Map()) {
  return render(<SWRConfig value={{ provider: () => cache }}>{ui}</SWRConfig>);
}

type Route = (body: unknown) => [number, unknown?];

// Stubs fetch with handlers keyed by "METHOD /path" and records every request.
export function mockFetch(routes: Record<string, Route>) {
  const calls: { key: string; body: unknown }[] = [];
  const fetchMock = vi.fn(async (path: string, init: RequestInit = {}) => {
    const key = `${init.method ?? "GET"} ${path}`;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ key, body });
    const route = routes[key];
    if (!route) throw new Error(`Unexpected request ${key}`);
    const [status, json] = route(body);
    return new Response(json === undefined ? null : JSON.stringify(json), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}
