"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { fetcher, ApiError } from "@/lib/fetcher";
import { getAccessToken } from "@/lib/auth";
import type { Prescription, PrescriptionStatus } from "@/types/prescriptions";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const API_PATH_PREFIX =
  process.env.NEXT_PUBLIC_API_PATH_PREFIX ?? "/api";

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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function PatientPrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadPrescription = useCallback(async () => {
    if (!id) {
      setError("Identificador de prescripción no válido");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetcher<Prescription>(`/prescriptions/${id}`);
      setPrescription(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Error al cargar la prescripción";
      setError(message);
      setPrescription(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPrescription();
  }, [loadPrescription]);

  const handleConsume = async () => {
    if (!prescription || prescription.status !== "pending") return;
    setIsConsuming(true);
    try {
      await fetcher(`/prescriptions/${prescription.id}/consume`, {
        method: "PUT",
        body: JSON.stringify({ status: "consumed" }),
      });
      setPrescription((prev) =>
        prev
          ? { ...prev, status: "consumed", consumedAt: new Date().toISOString() }
          : prev
      );
      toast.success("Prescripción marcada como consumida");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Error al actualizar el estado";
      toast.error(message);
    } finally {
      setIsConsuming(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!prescription) return;
    setIsDownloading(true);
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
      setIsDownloading(false);
    }
  };

  if (!id) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ErrorState
          message="Identificador de prescripción no válido"
          onBack={() => router.push("/patient/prescriptions")}
        />
      </div>
    );
  }

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !prescription) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ErrorState
          message={error ?? "Prescripción no encontrada"}
          onBack={() => router.push("/patient/prescriptions")}
          onRetry={loadPrescription}
        />
      </div>
    );
  }

  const status = STATUS_BADGE[prescription.status] ?? {
    variant: "neutral" as const,
    label: prescription.status,
  };

  const isPending = prescription.status === "pending";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/patient/prescriptions">
            <button
              type="button"
              className="mt-0.5 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Volver al listado"
            >
              <ArrowLeftIcon />
            </button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                {prescription.code}
              </h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Emitida el {formatDate(prescription.createdAt)}
            </p>
            {prescription.consumedAt && (
              <p className="text-sm text-emerald-400/80">
                Consumida el {formatDate(prescription.consumedAt)}
              </p>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:shrink-0">
          {isPending && (
            <Button
              variant="primary"
              onClick={handleConsume}
              disabled={isConsuming}
            >
              {isConsuming ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  Marcar como consumida
                </span>
              )}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="flex items-center gap-2">
                <SpinnerIcon />
                Descargando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <DownloadIcon />
                Descargar PDF
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Info grid: doctor + patient */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Doctor */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Médico prescriptor
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-base font-semibold text-emerald-400">
              {prescription.author.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Dr/a. {prescription.author.user.name}
              </p>
              <p className="text-sm text-slate-400">
                Lic. {prescription.author.licenseNumber}
              </p>
              {prescription.author.specialty && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {prescription.author.specialty}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Patient (self) */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Paciente
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600/20 text-base font-semibold text-sky-400">
              {prescription.patient.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {prescription.patient.user.name}
              </p>
              <p className="text-sm text-slate-400">
                {prescription.patient.user.email}
              </p>
              {prescription.patient.phone && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {prescription.patient.phone}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Medications — card list on mobile, table on desktop */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-900 dark:text-slate-100">
            Medicamentos
            <span className="ml-2 rounded-full bg-indigo-600/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
              {prescription.items.length}
            </span>
          </h2>
        </div>

        {/* Table — hidden on xs, shown from md */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                {[
                  "Medicamento",
                  "Dosis",
                  "Frecuencia",
                  "Duración",
                  "Instrucciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {item.medication}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.dosage}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.frequency}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.duration}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.instructions || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — shown on xs/sm, hidden from md */}
        <div className="flex flex-col divide-y divide-slate-800 md:hidden">
          {prescription.items.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{item.medication}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Dosis</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{item.dosage}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Frecuencia</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{item.frequency}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Duración</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{item.duration}</dd>
                </div>
                {item.instructions && (
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Instrucciones</dt>
                    <dd className="text-slate-700 dark:text-slate-300">{item.instructions}</dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      {prescription.notes && (
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notas del médico
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {prescription.notes}
          </p>
        </section>
      )}

      {/* Consume CTA on mobile — sticky bottom */}
      {isPending && (
        <div className="sticky bottom-4 sm:hidden">
          <button
            onClick={handleConsume}
            disabled={isConsuming}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConsuming ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon />
                Procesando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckIcon />
                Marcar como consumida
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="mb-2 h-7 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
      <Skeleton className="mb-4 h-3 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onBack,
  onRetry,
}: {
  message: string;
  onBack: () => void;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <AlertIcon />
      </div>
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-200">No se pudo cargar el detalle</p>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Volver al listado
        </Button>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
