"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";
import { setTokens } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser, TokenPair } from "@/types/auth";
import { ROLE_ROUTES } from "@/types/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// ─── Validation schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Ingresa un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "Mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const tokens = await fetcher<TokenPair>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });

      // Persist tokens before fetching the profile (fetcher will attach the token)
      setTokens(tokens.accessToken, tokens.refreshToken);

      const user = await fetcher<AuthUser>("/auth/profile");

      setAuth(user, tokens.accessToken, tokens.refreshToken);

      toast.success(`Bienvenido, ${user.name} 👋`);
      router.push(ROLE_ROUTES[user.role]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-600/20">
              <svg
                className="h-7 w-7 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <Input
              id="email"
              label="Correo electrónico"
              type="email"
              placeholder="usuario@clinica.com"
              autoComplete="email"
              error={errors.email?.message}
              disabled={isLoading}
              {...register("email")}
            />

            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              disabled={isLoading}
              {...register("password")}
            />

            <Button
              type="submit"
              variant="primary"
              className="mt-2 w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cuentas de prueba
            </p>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <span className="text-indigo-400">Admin:</span>{" "}
                admin@clinica.com / Admin123!
              </li>
              <li>
                <span className="text-emerald-400">Doctor:</span>{" "}
                doctor@clinica.com / Doctor123!
              </li>
              <li>
                <span className="text-sky-400">Paciente:</span>{" "}
                paciente@clinica.com / Patient123!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
