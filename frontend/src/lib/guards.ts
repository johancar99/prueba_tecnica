export type { Role } from "@/types/auth";
export { ROLE_ROUTES, ROLE_ALLOWED_PREFIXES } from "@/types/auth";

import { getAccessToken } from "./auth";

export function isClientAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
