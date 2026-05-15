import { redirect } from "next/navigation";

/**
 * Root route — the middleware handles smart redirects (authenticated users go
 * directly to their dashboard). This server-side redirect is the fallback for
 * any edge case the middleware might miss.
 */
export default function Home() {
  redirect("/login");
}
