"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { fetcher, ApiError } from "@/lib/fetcher";
import type { PatientRecord, CreatePrescriptionPayload } from "@/types/prescriptions";
import type { PaginatedResponse } from "@/types/users";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// ─── Validation schema ────────────────────────────────────────────────────────

const itemSchema = z.object({
  medication: z.string().min(1, "Nombre del medicamento requerido"),
  dosage: z.string().min(1, "Dosis requerida"),
  frequency: z.string().min(1, "Frecuencia requerida"),
  duration: z.string().min(1, "Duración requerida"),
  instructions: z.string().optional(),
});

const formSchema = z.object({
  patientId: z.string().min(1, "Debes seleccionar un paciente"),
  notes: z.string().optional(),
  items: z
    .array(itemSchema)
    .min(1, "Agrega al menos un medicamento"),
});

type FormValues = z.infer<typeof formSchema>;

const EMPTY_ITEM = {
  medication: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPrescriptionPage() {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      notes: "",
      items: [{ ...EMPTY_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // ── Patient search state ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced patient search
  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPatientResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const qs = new URLSearchParams({ search: query, limit: "8" });
      const res = await fetcher<PaginatedResponse<PatientRecord>>(
        `/patients?${qs.toString()}`
      );
      setPatientResults(res.data ?? []);
      setShowDropdown(true);
    } catch {
      setPatientResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPatients]);

  const handleSelectPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setValue("patientId", patient.id, { shouldValidate: true });
    setSearchQuery("");
    setShowDropdown(false);
    setPatientResults([]);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setValue("patientId", "", { shouldValidate: false });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: CreatePrescriptionPayload = {
        patientId: data.patientId,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          medication: item.medication,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions || undefined,
        })),
      };

      await fetcher("/prescriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Prescripción creada correctamente");
      router.push("/doctor/prescriptions");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Error al crear la prescripción";
      toast.error(message);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/doctor/prescriptions">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Volver"
          >
            <ArrowLeftIcon />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nueva Prescripción</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Completa los datos del paciente y los medicamentos a prescribir
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        {/* ── Patient section ─────────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <PatientIcon />
            Datos del Paciente
          </h2>

          <Controller
            control={control}
            name="patientId"
            render={() => (
              <div>
                {selectedPatient ? (
                  /* Selected patient card */
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-semibold text-emerald-400">
                        {selectedPatient.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedPatient.user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedPatient.user.email}
                          {selectedPatient.phone && ` · ${selectedPatient.phone}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearPatient}
                      className="ml-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
                      aria-label="Cambiar paciente"
                    >
                      <XIcon />
                    </button>
                  </div>
                ) : (
                  /* Search input */
                  <div ref={searchRef} className="relative">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="search"
                        placeholder="Buscar paciente por nombre o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (patientResults.length > 0) setShowDropdown(true);
                        }}
                        className={[
                          "w-full rounded-lg border bg-slate-800/60 py-2.5 pl-9 pr-4 text-sm text-slate-100",
                          "placeholder-slate-500 outline-none transition-colors",
                          "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
                          errors.patientId
                            ? "border-red-500"
                            : "border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
                        ].join(" ")}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <SpinnerIcon className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Dropdown results */}
                    {showDropdown && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
                        {patientResults.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-500">
                            Sin resultados para &ldquo;{searchQuery}&rdquo;
                          </p>
                        ) : (
                          <ul>
                            {patientResults.map((p) => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectPatient(p)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600/20 text-xs font-semibold text-sky-400">
                                    {p.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                      {p.user.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                      {p.user.email}
                                    </p>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {errors.patientId && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                        <ErrorIcon />
                        {errors.patientId.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          />
        </section>

        {/* ── Items section ───────────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <PillIcon />
              Medicamentos
              <span className="ml-1 rounded-full bg-indigo-600/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                {fields.length}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => append({ ...EMPTY_ITEM })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
            >
              <PlusSmIcon />
              Agregar medicamento
            </button>
          </div>

          {errors.items?.root && (
            <p className="mb-4 flex items-center gap-1 text-sm text-red-400">
              <ErrorIcon />
              {errors.items.root.message}
            </p>
          )}

          {typeof errors.items?.message === "string" && (
            <p className="mb-4 flex items-center gap-1 text-sm text-red-400">
              <ErrorIcon />
              {errors.items.message}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-lg border border-slate-700/60 bg-slate-800/30 p-4"
              >
                {/* Item header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Medicamento #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Eliminar medicamento ${index + 1}`}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>

                {/* Row 1: medication + dosage */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Medicamento *"
                    placeholder="ej. Ibuprofeno 400mg"
                    error={errors.items?.[index]?.medication?.message}
                    disabled={isSubmitting}
                    {...register(`items.${index}.medication`)}
                  />
                  <Input
                    label="Dosis *"
                    placeholder="ej. 400mg"
                    error={errors.items?.[index]?.dosage?.message}
                    disabled={isSubmitting}
                    {...register(`items.${index}.dosage`)}
                  />
                </div>

                {/* Row 2: frequency + duration */}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Frecuencia *"
                    placeholder="ej. Cada 8 horas"
                    error={errors.items?.[index]?.frequency?.message}
                    disabled={isSubmitting}
                    {...register(`items.${index}.frequency`)}
                  />
                  <Input
                    label="Duración *"
                    placeholder="ej. 7 días"
                    error={errors.items?.[index]?.duration?.message}
                    disabled={isSubmitting}
                    {...register(`items.${index}.duration`)}
                  />
                </div>

                {/* Row 3: instructions */}
                <div className="mt-3">
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Instrucciones adicionales
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Tomar con alimentos"
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors hover:border-slate-400 dark:hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register(`items.${index}.instructions`)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile add button */}
          <button
            type="button"
            onClick={() => append({ ...EMPTY_ITEM })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 py-3 text-sm text-slate-500 transition-colors hover:border-indigo-500/40 hover:text-indigo-400 sm:hidden"
          >
            <PlusSmIcon />
            Agregar otro medicamento
          </button>
        </section>

        {/* ── Notes section ───────────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <NotesIcon />
            Notas y Observaciones
          </h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Observaciones clínicas
            </label>
            <textarea
              rows={4}
              placeholder="Notas adicionales sobre el tratamiento, alergias conocidas, advertencias, etc."
              disabled={isSubmitting}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors hover:border-slate-400 dark:hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("notes")}
            />
          </div>
        </section>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/doctor/prescriptions">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <SpinnerIcon className="h-4 w-4" />
                Guardando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SaveIcon />
                Crear Prescripción
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function PatientIcon() {
  return (
    <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusSmIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function SpinnerIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}
