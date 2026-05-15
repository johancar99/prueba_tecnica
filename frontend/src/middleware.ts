import { NextRequest, NextResponse } from "next/server";
import type { BackendRole } from "@/types/auth";
import { ROLE_ROUTES, ROLE_ALLOWED_PREFIXES } from "@/types/auth";

// ─── Route config ─────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ["/admin", "/doctor", "/patient"];
const AUTH_PAGES = ["/login"];

// ─── JWT helpers (Edge-compatible) ───────────────────────────────────────────

interface JwtPayload {
  sub: string;
  email: string;
  role: BackendRole;
  iat: number;
  exp: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, raw] = token.split(".");
    if (!raw) return null;
    // Normalize base64url → base64 and decode in Edge runtime
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  return Date.now() / 1000 >= payload.exp;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  // ── Root path: redirect to dashboard (authenticated) or login ─────────────
  if (pathname === "/") {
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && !isExpired(payload)) {
        return NextResponse.redirect(
          new URL(ROLE_ROUTES[payload.role] ?? "/login", request.url)
        );
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // ── Authenticated user visiting login → redirect to their dashboard ────────
  if (isAuthPage && token) {
    const payload = decodeJwtPayload(token);
    if (payload && !isExpired(payload)) {
      return NextResponse.redirect(
        new URL(ROLE_ROUTES[payload.role] ?? "/", request.url)
      );
    }
  }

  // ── Protected route checks ─────────────────────────────────────────────────
  if (isProtected) {
    // No token → go to login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayload(token);

    // Malformed or expired token → go to login
    if (!payload || isExpired(payload)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear stale cookie
      response.cookies.delete("access_token");
      return response;
    }

    // Wrong role for the requested path → redirect to their own dashboard
    const allowed = ROLE_ALLOWED_PREFIXES[payload.role] ?? [];
    const hasAccess = allowed.some((p) => pathname.startsWith(p));

    if (!hasAccess) {
      return NextResponse.redirect(
        new URL(ROLE_ROUTES[payload.role] ?? "/", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
