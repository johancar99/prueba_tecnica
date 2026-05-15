"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { fetcher, ApiError } from "@/lib/fetcher";
import { getAccessToken } from "@/lib/auth";
import type { Prescription, PrescriptionStatus } from "@/types/prescriptions";
import type { PaginatedResponse } from "@/types/users";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 9;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const API_PATH_PREFIX =
  process.env.NEXT_PUBLIC_API_PATH_PREFIX ?? "/api";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "consumed", label: "Consumidas" },
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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function PatientPrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? "1");
  const currentStatus = searchParams.get("status") ?? "";

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Prescription>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [consumingId, setConsumingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchPrescriptions = useCallback(
    async (params: { page: number; status: string }) => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("page", String(params.page));
        qs.set("limit", String(PAGE_SIZE));
        if (params.status) qs.set("status", params.status);

        const res = await fetcher<PaginatedResponse<Prescription>>(
          `/prescriptions/me?${qs.toString()}`
        );
        setPrescriptions(res.data ?? []);
        setMeta(res.meta ?? null);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Error al cargar las prescripciones";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPrescriptions({ page: currentPage, status: currentStatus });
  }, [fetchPrescriptions, currentPage, currentStatus]);

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

  const handleConsume = async (prescription: Prescription) => {
    if (prescription.status !== "pending") return;
    setConsumingId(prescription.id);
    try {
      await fetcher(`/prescriptions/${prescription.id}/consume`, {
        method: "PUT",
        body: JSON.stringify({ status: "consumed" }),
      });
      setPrescriptions((prev) =>
        prev.map((rx) =>
          rx.id === prescription.id
            ? { ...rx, status: "consumed", consumedAt: new Date().toISOString() }
            : rx
        )
      );
      toast.success("Prescripción marcada como consumida");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Error al actualizar el estado";
      toast.error(message);
    } finally {
      setConsumingId(null);
    }
  };

  const handleDownloadPdf = async (prescription: Prescription) => {
    setDownloadingId(prescription.id);
    try {
      const token = getAccessToken();
      const path = API_PATH_PREFIX.startsWith("/")
        ? `${API_PATH_PREFIX}/prescriptions/${prescription.id}/pdf`
        : `/${API_PATH_PREFIX}/prescriptions/${prescription.id}/pdf`;
      const url = `${API_BASE_URL}${path}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const raw = body?.message;
        const message = Array.isArray(raw)
          ? raw.join(", ")
          : (raw ?? "No se pudo descargar el PDF");
        throw new Error(message);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `prescripcion-${prescription.code}.pdf`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("PDF descargado correctamente");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al descargar el PDF";
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const hasFilters = Boolean(currentStatus);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mis Prescripciones</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isLoading
            ? "Cargando..."
            : meta
              ? `${meta.total} prescripción${meta.total !== 1 ? "es" : ""}`
              : "Sin resultados"}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => pushParams({ status: opt.value })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currentStatus === opt.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <PrescriptionCardSkeleton key={i} />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClearFilters={() => router.push("/patient/prescriptions")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {prescriptions.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              prescription={rx}
              isConsuming={consumingId === rx.id}
              isDownloading={downloadingId === rx.id}
              onConsume={handleConsume}
              onDownload={handleDownloadPdf}
            />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}

interface PrescriptionCardProps {
  prescription: Prescription;
  isConsuming: boolean;
  isDownloading: boolean;
  onConsume: (rx: Prescription) => void;
  onDownload: (rx: Prescription) => void;
}

function PrescriptionCard({
  prescription: rx,
  isConsuming,
  isDownloading,
  onConsume,
  onDownload,
}: PrescriptionCardProps) {
  const status = STATUS_BADGE[rx.status] ?? {
    variant: "neutral" as const,
    label: rx.status,
  };

  const isPending = rx.status === "pending";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 transition-colors hover:border-slate-700">
      {/* Top: code + status */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {rx.code}
        </span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Doctor info */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-semibold text-emerald-400">
          {rx.author.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
            Dr/a. {rx.author.user.name}
          </p>
          {rx.author.specialty && (
            <p className="truncate text-xs text-slate-500">
              {rx.author.specialty}
            </p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-1 text-xs text-slate-500">
        <span>
          <span className="text-slate-400">Emitida:</span>{" "}
          {formatDate(rx.createdAt)}
        </span>
        {rx.consumedAt && (
          <span>
            <span className="text-emerald-400/80">Consumida:</span>{" "}
            {formatDate(rx.consumedAt)}
          </span>
        )}
        <span>
          <span className="text-slate-400">Medicamentos:</span>{" "}
          {rx.items.length} ítem{rx.items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        <Link href={`/patient/prescriptions/${rx.id}`} className="flex-1">
          <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-400">
            <EyeIcon />
            Ver detalle
          </button>
        </Link>

        <button
          onClick={() => onDownload(rx)}
          disabled={isDownloading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          title="Descargar PDF"
        >
          {isDownloading ? <SpinnerIcon /> : <DownloadIcon />}
        </button>

        {isPending && (
          <button
            onClick={() => onConsume(rx)}
            disabled={isConsuming}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-600/10 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            title="Marcar como consumida"
          >
            {isConsuming ? <SpinnerIcon /> : <CheckIcon />}
            <span className="hidden sm:inline">Consumida</span>
          </button>
        )}
      </div>
    </div>
  );
}

function PrescriptionCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-auto flex gap-2 border-t border-slate-800 pt-4">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-10 rounded-lg" />
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-20 text-center">
      <div className="rounded-full bg-slate-800 p-5">
        <svg
          className="h-10 w-10 text-slate-600"
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
      </div>
      <div>
        <p className="font-semibold text-slate-200">
          {hasFilters
            ? "Sin prescripciones para este filtro"
            : "Aún no tienes prescripciones"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {hasFilters
            ? "Prueba cambiando el filtro de estado"
            : "Tu médico aún no ha emitido prescripciones a tu nombre"}
        </p>
      </div>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
        >
          Ver todas las prescripciones
        </button>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
