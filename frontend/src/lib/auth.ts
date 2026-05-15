const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/** Access token TTL in seconds – must match backend JWT_ACCESS_TTL (900 = 15 min) */
const ACCESS_TOKEN_MAX_AGE = 900;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Persists both tokens.
 * The access token is also written to a non-httpOnly cookie so the
 * Next.js Edge middleware can read it for server-side route protection.
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax`;
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
