"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { fetcher, ApiError } from "@/lib/fetcher";
import type { UserRecord, PaginatedResponse, UsersQueryParams } from "@/types/users";
import type { BackendRole } from "@/types/auth";
import Badge, { roleToBadgeVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import UserCreateModal from "@/components/admin/UserCreateModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<BackendRole, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Médico",
  PATIENT: "Paciente",
};

const ROLE_FILTER_OPTIONS: { value: BackendRole | ""; label: string }[] = [
  { value: "", label: "Todos los roles" },
  { value: "DOCTOR", label: "Médico" },
  { value: "PATIENT", label: "Paciente" },
  { value: "ADMIN", label: "Administrador" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive state from URL so filters survive reload / can be shared
  const currentPage = Number(searchParams.get("page") ?? "1");
  const currentSearch = searchParams.get("search") ?? "";
  const currentRole = (searchParams.get("role") ?? "") as BackendRole | "";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<UserRecord>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (params: UsersQueryParams) => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(params.page ?? 1));
      qs.set("limit", String(PAGE_SIZE));
      if (params.search) qs.set("search", params.search);
      if (params.role) qs.set("role", params.role);

      const res = await fetcher<PaginatedResponse<UserRecord>>(
        `/users?${qs.toString()}`
      );
      setUsers(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Error al cargar los usuarios";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers({
      page: currentPage,
      search: currentSearch,
      role: currentRole,
    });
  }, [fetchUsers, currentPage, currentSearch, currentRole]);

  // ── URL helpers ──────────────────────────────────────────────────────────────

  const pushParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    next.set("page", updates.page ?? "1"); // reset to page 1 on filter change
    router.push(`?${next.toString()}`);
  };

  const handleSearch = (value: string) => {
    pushParams({ search: value, page: "1" });
  };

  const handleRoleFilter = (role: BackendRole | "") => {
    pushParams({ role, page: "1" });
  };

  const handlePageChange = (page: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    router.push(`?${next.toString()}`);
  };

  // ── After create ─────────────────────────────────────────────────────────────

  const handleUserCreated = (user: UserRecord) => {
    // Optimistic: add to top if on page 1 and no filters
    if (currentPage === 1 && !currentSearch && !currentRole) {
      setUsers((prev) => [user, ...prev.slice(0, PAGE_SIZE - 1)]);
      setMeta((prev) => prev ? { ...prev, total: prev.total + 1 } : prev);
    } else {
      // Refresh current view
      fetchUsers({ page: currentPage, search: currentSearch, role: currentRole });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {meta
              ? `${meta.total} usuario${meta.total !== 1 ? "s" : ""} registrados`
              : "Cargando..."}
          </p>
        </div>
        <Button
          variant="primary"
          className="mt-3 sm:mt-0"
          onClick={() => setIsCreateOpen(true)}
        >
          <PlusIcon />
          Nuevo usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            placeholder="Buscar por nombre o email..."
            defaultValue={currentSearch}
            onChange={(e) => {
              const val = e.target.value;
              const timer = setTimeout(() => handleSearch(val), 400);
              return () => clearTimeout(timer);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 py-2.5 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Role filter */}
        <select
          value={currentRole}
          onChange={(e) => handleRoleFilter(e.target.value as BackendRole | "")}
          className="rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-48"
        >
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-800">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Fecha de registro
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Perfil
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={5} />
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <EmptyState
                      hasFilters={Boolean(currentSearch || currentRole)}
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <Pagination meta={meta} onPageChange={handlePageChange} />
        )}
      </div>

      {/* Create modal */}
      <UserCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleUserCreated}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserRow({ user }: { user: UserRecord }) {
  const profileDetail =
    user.role === "DOCTOR" && user.doctor
      ? user.doctor.specialty ?? user.doctor.licenseNumber
      : user.role === "PATIENT" && user.patient
      ? user.patient.phone ?? "Sin teléfono"
      : "—";

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
      {/* Name + avatar */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-400">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-200">{user.name}</span>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.email}</td>

      {/* Role badge */}
      <td className="px-4 py-3">
        <Badge variant={roleToBadgeVariant(user.role)}>
          {ROLE_LABELS[user.role]}
        </Badge>
      </td>

      {/* Joined date */}
      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
        {new Intl.DateTimeFormat("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(user.createdAt))}
      </td>

      {/* Profile detail */}
      <td className="px-4 py-3 text-slate-500">{profileDetail}</td>
    </tr>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 text-slate-500">
      <svg
        className="h-10 w-10 text-slate-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
      <p className="font-medium">
        {hasFilters
          ? "Sin resultados para los filtros actuales"
          : "No hay usuarios registrados"}
      </p>
      {hasFilters && (
        <p className="text-xs">Prueba ajustando la búsqueda o el filtro de rol</p>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg
      className="mr-1.5 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
