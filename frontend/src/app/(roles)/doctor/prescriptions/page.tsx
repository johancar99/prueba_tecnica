"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { fetcher, ApiError } from "@/lib/fetcher";
import type { Prescription, PrescriptionStatus } from "@/types/prescriptions";
import type { PaginatedResponse } from "@/types/users";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTableRow } from "@/components/ui/Skeleton";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "consumed", label: "Consumida" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

const STATUS_BADGE: Record<
  PrescriptionStatus,
  { variant: "warning" | "success" | "neutral" | "danger"; label: string }
> = {
  pending: { variant: "warning", label: "Pendiente" },
  consumed: { variant: "success", label: "Consumida" },
  completed: { variant: "neutral", label: "Completada" },
  cancelled: { variant: "danger", label: "Cancelada" },
};

export default function DoctorPrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? "1");
  const currentStatus = searchParams.get("status") ?? "";
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Prescription>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrescriptions = useCallback(
    async (params: { page: number; status: string; from: string; to: string }) => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("page", String(params.page));
        qs.set("limit", String(PAGE_SIZE));
        if (params.status) qs.set("status", params.status);
        if (params.from) qs.set("from", params.from);
        if (params.to) qs.set("to", params.to);

        const res = await fetcher<PaginatedResponse<Prescription>>(
          `/prescriptions?${qs.toString()}`
        );
        setPrescriptions(res.data ?? []);
        setMeta(res.meta ?? null);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Error al cargar las prescripciones";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPrescriptions({
      page: currentPage,
      status: currentStatus,
      from: currentFrom,
      to: currentTo,
    });
  }, [fetchPrescriptions, currentPage, currentStatus, currentFrom, currentTo]);

  const pushParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!("page" in updates)) next.set("page", "1");
    router.push(`?${next.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    router.push(`?${next.toString()}`);
  };

  const hasFilters = Boolean(currentStatus || currentFrom || currentTo);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mis Prescripciones</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {meta
              ? `${meta.total} prescripción${meta.total !== 1 ? "es" : ""}`
              : "Cargando..."}
          </p>
        </div>
        <Link href="/doctor/prescriptions/new">
          <Button variant="primary" className="mt-3 sm:mt-0">
            <PlusIcon />
            Nueva Prescripción
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex flex-col gap-1.5 sm:w-48">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Estado
          </label>
          <select
            value={currentStatus}
            onChange={(e) => pushParams({ status: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:w-44">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Desde
          </label>
          <input
            type="date"
            value={currentFrom}
            onChange={(e) => pushParams({ from: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:w-44">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Hasta
          </label>
          <input
            type="date"
            value={currentTo}
            onChange={(e) => pushParams({ to: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => router.push("/doctor/prescriptions")}
            className="self-end rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                {["Código", "Paciente", "Estado", "Fecha", "Acciones"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={5} />
                ))
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <EmptyState hasFilters={hasFilters} />
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <PrescriptionRow key={rx.id} prescription={rx} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <Pagination meta={meta} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
}

function PrescriptionRow({ prescription: rx }: { prescription: Prescription }) {
  const status = STATUS_BADGE[rx.status] ?? {
    variant: "neutral" as const,
    label: rx.status,
  };

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-medium text-indigo-400">
          {rx.code}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600/20 text-xs font-semibold text-sky-400">
            {rx.patient.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800 dark:text-slate-200">
              {rx.patient.user.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {rx.patient.user.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>

      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
        {new Intl.DateTimeFormat("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(rx.createdAt))}
      </td>

      <td className="px-4 py-3">
        <Link href={`/doctor/prescriptions/${rx.id}`}>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-400">
            <EyeIcon />
            Ver detalle
          </button>
        </Link>
      </td>
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="font-medium">
        {hasFilters
          ? "Sin prescripciones para los filtros actuales"
          : "Aún no has creado ninguna prescripción"}
      </p>
      {!hasFilters && (
        <Link href="/doctor/prescriptions/new">
          <button className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline">
            Crear la primera prescripción →
          </button>
        </Link>
      )}
      {hasFilters && (
        <p className="text-xs">Prueba ajustando los filtros de estado o fechas</p>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      className="mr-1.5 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}
.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}
