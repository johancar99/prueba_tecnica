import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";
import { useAuthStore } from "@/store/authStore";
import type { TokenPair } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

/** Global prefix del backend Nest (ej. `app.setGlobalPrefix('api')`) */
const API_PATH_PREFIX =
  process.env.NEXT_PUBLIC_API_PATH_PREFIX ?? "/api";

function resolveApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith(`${API_PATH_PREFIX}/`)) {
    return `${API_BASE_URL}${normalized}`;
  }
  return `${API_BASE_URL}${API_PATH_PREFIX}${normalized}`;
}

// ─── Token-refresh queue ──────────────────────────────────────────────────────
// Prevents multiple concurrent 401s from each triggering their own refresh call.
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(token: string) {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
}

function rejectQueue(err: unknown) {
  pendingQueue.forEach(({ reject }) => reject(err));
  pendingQueue = [];
}

/**
 * Unwraps the { statusCode, message, data [, meta] } envelope from the API.
 * Paginated lists keep both `data` and `meta` at the top level of the result.
 */
function unwrapEnvelope<T>(json: unknown): T {
  if (
    json === null ||
    typeof json !== "object" ||
    !("statusCode" in json) ||
    !("data" in json)
  ) {
    return json as T;
  }

  const envelope = json as {
    data: unknown;
    meta?: unknown;
  };

  const hasMeta =
    "meta" in envelope &&
    envelope.meta !== null &&
    typeof envelope.meta === "object";

  if (hasMeta && Array.isArray(envelope.data)) {
    return { data: envelope.data, meta: envelope.meta } as T;
  }

  return envelope.data as T;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No hay sesión activa");
  }

  const res = await fetch(resolveApiUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sesión expirada. Por favor inicia sesión de nuevo.");
  }

  const tokens = unwrapEnvelope<TokenPair>(await res.json());
  setTokens(tokens.accessToken, tokens.refreshToken);
  useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);

  return tokens.accessToken;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type FetcherOptions = RequestInit & {
  /** Set true for public endpoints (login, register) to skip attaching a token */
  skipAuth?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetcher<T>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> {
  const { skipAuth = false, headers, ...rest } = options;

  const buildHeaders = (token: string | null): HeadersInit => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  });

  const execute = (token: string | null) =>
    fetch(resolveApiUrl(path), {
      headers: buildHeaders(token),
      ...rest,
    });

  const token = skipAuth ? null : getAccessToken();
  let res = await execute(token);

  // ── 401: attempt transparent token rotation ───────────────────────────────
  if (res.status === 401 && !skipAuth) {
    if (isRefreshing) {
      // Another refresh is in progress — queue this request until it resolves
      const newToken = await new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      });
      res = await execute(newToken);
    } else {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        flushQueue(newToken);
        res = await execute(newToken);
      } catch (err) {
        rejectQueue(err);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const raw = body?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : (raw ?? res.statusText ?? "Error en la petición");
    throw new ApiError(message, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  return unwrapEnvelope<T>(json);
}
