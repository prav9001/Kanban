export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const AUTH_PAGES = ["/login", "/signup"];

export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  // A full page load on an expired session drops all cached client state.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (res.status === 401 && !AUTH_PAGES.includes(window.location.pathname)) window.location.assign("/login");
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new ApiError(error ?? "Something went wrong", res.status);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
