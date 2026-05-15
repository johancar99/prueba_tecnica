export type BackendRole = "ADMIN" | "DOCTOR" | "PATIENT";
export type Role = "admin" | "doctor" | "patient";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: BackendRole;
  createdAt: string;
  doctor: {
    id: string;
    licenseNumber: string;
    specialty: string | null;
  } | null;
  patient: {
    id: string;
    birthDate: string | null;
    phone: string | null;
  } | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const ROLE_ROUTES: Record<BackendRole, string> = {
  ADMIN: "/admin",
  DOCTOR: "/doctor/prescriptions",
  PATIENT: "/patient/prescriptions",
};

export const ROLE_ALLOWED_PREFIXES: Record<BackendRole, string[]> = {
  ADMIN: ["/admin"],
  DOCTOR: ["/doctor"],
  PATIENT: ["/patient"],
};

export function normalizeRole(backendRole: BackendRole): Role {
  return backendRole.toLowerCase() as Role;
}
