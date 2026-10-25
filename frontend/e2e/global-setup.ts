import type { FullConfig } from "@playwright/test";

// Warm each route once so the first tests do not pay for cold starts.
export default async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  for (const path of ["/login", "/signup", "/boards", "/boards/warmup", "/account", "/api/auth/me", "/api/boards"]) {
    await fetch(`${baseURL}${path}`, { headers: { cookie: "session=warmup" } });
  }
}
