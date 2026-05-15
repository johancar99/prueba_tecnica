"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetcher, ApiError } from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Metrics {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: {
    pending: number;
    consumed: number;
    completed: number;
    cancelled: number;
  };
  byDay: Array<{ date: string; count: number }>;
  topDoctors: Array<{
    doctorId: string;
    licenseNumber: string;
    specialty: string | null;
    name: string;
    email: string;
    prescriptionsCount: number;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  consumed: "#10b981",
  completed: "#6366f1",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  consumed: "Consumida",
  completed: "Completada",
  cancelled: "Cancelada",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(
    async (from: string, to: string) => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams();
        if (from) qs.set("from", from);
        if (to) qs.set("to", to);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        const data = await fetcher<Metrics>(`/admin/metrics${query}`);
        setMetrics(data);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Error al cargar las métricas";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchMetrics(currentFrom, currentTo);
  }, [fetchMetrics, currentFrom, currentTo]);

  const pushParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    router.push(`?${next.toString()}`);
  };

  const hasFilters = Boolean(currentFrom || currentTo);

  const pieData = metrics
    ? Object.entries(metrics.byStatus)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: STATUS_LABELS[key] ?? key,
          value,
          color: STATUS_COLORS[key] ?? "#94a3b8",
        }))
    : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Resumen general del sistema
          </p>
        </div>

        {/* Date filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Desde
            </label>
            <input
              type="date"
              value={currentFrom}
              onChange={(e) => pushParams({ from: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Hasta
            </label>
            <input
              type="date"
              value={currentTo}
              onChange={(e) => pushParams({ to: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => router.push("/admin")}
              className="self-end rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-200"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Médicos registrados"
            value={metrics?.totals.doctors ?? 0}
            icon={<DoctorIcon />}
            color="emerald"
          />
          <SummaryCard
            label="Pacientes registrados"
            value={metrics?.totals.patients ?? 0}
            icon={<PatientIcon />}
            color="sky"
          />
          <SummaryCard
            label="Prescripciones totales"
            value={metrics?.totals.prescriptions ?? 0}
            icon={<PrescriptionIcon />}
            color="indigo"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Line chart — 2/3 width */}
        <div className="xl:col-span-2">
          <ChartCard title="Prescripciones por día (últimos 30 días)">
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : metrics && metrics.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={metrics.byDay}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#1e293b" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                    labelFormatter={(label) => `Fecha: ${label}`}
                    formatter={(value: number) => [value, "Prescripciones"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#6366f1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Sin datos de prescripciones en este periodo" />
            )}
          </ChartCard>
        </div>

        {/* Pie chart — 1/3 width */}
        <div>
          <ChartCard title="Distribución por estado">
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number, name: string): [number, string] => [value, name]}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Sin prescripciones registradas" />
            )}
          </ChartCard>
        </div>
      </div>

      {/* Top doctors table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Top médicos por volumen
            {metrics && (
              <span className="ml-2 rounded-full bg-indigo-600/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                {metrics.topDoctors.length}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col divide-y divide-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-1.5 h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        ) : metrics && metrics.topDoctors.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                    {["#", "Médico", "Matrícula", "Especialidad", "Prescripciones"].map(
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
                  {metrics.topDoctors.map((doc, index) => (
                    <tr
                      key={doc.doctorId}
                      className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 transition-colors hover:bg-slate-800/20"
                    >
                      <td className="px-4 py-3">
                        <RankBadge rank={index + 1} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-xs font-semibold text-emerald-400">
                            {doc.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {doc.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {doc.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {doc.licenseNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {doc.specialty ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-indigo-400">
                          {doc.prescriptionsCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col divide-y divide-slate-800 md:hidden">
              {metrics.topDoctors.map((doc, index) => (
                <div
                  key={doc.doctorId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <RankBadge rank={index + 1} />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-semibold text-emerald-400">
                    {doc.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {doc.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {doc.specialty ?? doc.licenseNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-indigo-400">
                      {doc.prescriptionsCount}
                    </p>
                    <p className="text-xs text-slate-600">Rx</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
            <svg
              className="h-8 w-8 text-slate-700"
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
            <p className="text-sm">Sin médicos con prescripciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ColorKey = "emerald" | "sky" | "indigo";

const COLOR_MAP: Record<ColorKey, { bg: string; icon: string; value: string }> = {
  emerald: {
    bg: "bg-emerald-600/10",
    icon: "text-emerald-400",
    value: "text-emerald-400",
  },
  sky: {
    bg: "bg-sky-600/10",
    icon: "text-sky-400",
    value: "text-sky-400",
  },
  indigo: {
    bg: "bg-indigo-600/10",
    icon: "text-indigo-400",
    value: "text-indigo-400",
  },
};

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: ColorKey;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
      <div className={`rounded-xl p-3 ${c.bg}`}>
        <div className={c.icon}>{icon}</div>
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`mt-0.5 text-3xl font-bold ${c.value}`}>
          {value.toLocaleString("es-ES")}
        </p>
      </div>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
      <Skeleton className="h-14 w-14 rounded-xl" />
      <div>
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-slate-600">
      {message}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "bg-amber-500/20 text-amber-400"
      : rank === 2
        ? "bg-slate-400/20 text-slate-300"
        : rank === 3
          ? "bg-orange-700/20 text-orange-500"
          : "bg-slate-800 text-slate-500";
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colors}`}
    >
      {rank}
    </span>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DoctorIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PatientIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PrescriptionIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
