import type { BackendRole } from "./auth";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: BackendRole;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    licenseNumber: string;
    specialty: string | null;
  } | null;
  patient: {
    id: string;
    birthDate: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  role?: BackendRole | "";
  search?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: "DOCTOR" | "PATIENT";
  licenseNumber?: string;
  specialty?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
}
