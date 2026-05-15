"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { fetcher, ApiError } from "@/lib/fetcher";
import type { CreateUserPayload, UserRecord } from "@/types/users";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

// ─── Schema ───────────────────────────────────────────────────────────────────

const createUserSchema = z
  .object({
    email: z.string().min(1, "El email es obligatorio").email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    name: z.string().min(2, "Mínimo 2 caracteres"),
    role: z.enum(["DOCTOR", "PATIENT"], {
      required_error: "Selecciona un rol",
    }),
    licenseNumber: z.string().optional(),
    specialty: z.string().optional(),
    birthDate: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "DOCTOR" && !data.licenseNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El número de licencia es obligatorio para médicos",
        path: ["licenseNumber"],
      });
    }
  });

type FormData = z.infer<typeof createUserSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserRecord) => void;
}

const ROLE_OPTIONS = [
  { value: "DOCTOR", label: "Médico (DOCTOR)" },
  { value: "PATIENT", label: "Paciente (PATIENT)" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: UserCreateModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "PATIENT" },
  });

  const selectedRole = watch("role");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) reset({ role: "PATIENT" });
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: CreateUserPayload = {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        ...(data.role === "DOCTOR" && {
          licenseNumber: data.licenseNumber,
          specialty: data.specialty || undefined,
        }),
        ...(data.role === "PATIENT" && {
          phone: data.phone || undefined,
          birthDate: data.birthDate || undefined,
          address: data.address || undefined,
        }),
      };

      const created = await fetcher<UserRecord>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(`Usuario ${created.name} creado correctamente`);
      onSuccess(created);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Error al crear el usuario";
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Crear nuevo usuario
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[70vh] overflow-y-auto p-6"
          noValidate
        >
          <div className="space-y-4">
            {/* Base fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nombre completo"
                placeholder="Dr. Juan García"
                error={errors.name?.message}
                disabled={isSubmitting}
                {...register("name")}
              />
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="usuario@clinica.com"
                error={errors.email?.message}
                disabled={isSubmitting}
                {...register("email")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                disabled={isSubmitting}
                {...register("password")}
              />
              <Select
                label="Rol"
                options={ROLE_OPTIONS}
                placeholder="Seleccionar rol"
                error={errors.role?.message}
                disabled={isSubmitting}
                {...register("role")}
              />
            </div>

            {/* Doctor-specific fields */}
            {selectedRole === "DOCTOR" && (
              <div className="space-y-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                  Datos del médico
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Número de licencia *"
                    placeholder="LIC-00123"
                    error={errors.licenseNumber?.message}
                    disabled={isSubmitting}
                    {...register("licenseNumber")}
                  />
                  <Input
                    label="Especialidad"
                    placeholder="Cardiología"
                    error={errors.specialty?.message}
                    disabled={isSubmitting}
                    {...register("specialty")}
                  />
                </div>
              </div>
            )}

            {/* Patient-specific fields */}
            {selectedRole === "PATIENT" && (
              <div className="space-y-4 rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
                  Datos del paciente
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Teléfono"
                    placeholder="+34 600 111 222"
                    error={errors.phone?.message}
                    disabled={isSubmitting}
                    {...register("phone")}
                  />
                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    error={errors.birthDate?.message}
                    disabled={isSubmitting}
                    {...register("birthDate")}
                  />
                </div>
                <Input
                  label="Dirección"
                  placeholder="Calle Mayor 1, Madrid"
                  error={errors.address?.message}
                  disabled={isSubmitting}
                  {...register("address")}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon />
                  Creando...
                </span>
              ) : (
                "Crear usuario"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
