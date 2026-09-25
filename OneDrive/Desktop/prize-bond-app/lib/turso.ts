import { createClient, type Client } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var __tursoClient: Client | undefined;
}

/**
 * Returns a singleton Turso (libSQL) client. Reused across hot reloads in
 * dev and across serverless invocations within the same runtime instance.
 */
function getTursoClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not configured. Set it in your environment variables."
    );
  }

  if (global.__tursoClient) {
    return global.__tursoClient;
  }

  const client = createClient({ url, authToken });

  if (process.env.NODE_ENV !== "production") {
    global.__tursoClient = client;
  }

  return client;
}

export const turso = getTursoClient();

/**
 * Wraps a DB call so callers get a consistent error shape instead of a raw
 * libSQL exception leaking into API responses.
 */
export async function safeDbCall<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    console.error("Database error:", err);
    const message = err instanceof Error ? err.message : "Unknown database error";
    return { data: null, error: message };
  }
}
