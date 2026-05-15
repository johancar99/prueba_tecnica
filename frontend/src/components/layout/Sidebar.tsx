"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { clearTokens } from "@/lib/auth";
import { fetcher } from "@/lib/fetcher";
import Badge, { roleToBadgeVariant } from "@/components/ui/Badge";
import type { Role } from "@/types/auth";

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <DashboardIcon />,
      exact: true,
    },
    {
      label: "Gestión de Usuarios",
      href: "/admin/users",
      icon: <UsersIcon />,
    },
  ],
  doctor: [
    {
      label: "Prescripciones",
      href: "/doctor/prescriptions",
      icon: <PrescriptionIcon />,
    },
  ],
  patient: [
    {
      label: "Mis Prescripciones",
      href: "/patient/prescriptions",
      icon: <PrescriptionIcon />,
    },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  doctor: "Médico",
  patient: "Paciente",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, clearAuth } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems: NavItem[] = role ? (NAV_BY_ROLE[role] ?? []) : [];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetcher("/auth/logout", { method: "POST" });
    } catch {
      // Even if the API call fails, clear the local session
    } finally {
      clearTokens();
      clearAuth();
      router.push("/login");
    }
  };

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <svg
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          MediScript
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className={
                    isActive(item)
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500"
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        {user && role ? (
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-600/30 dark:text-indigo-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <Badge
                variant={roleToBadgeVariant(user.role)}
                className="mt-1"
              >
                {ROLE_LABELS[role]}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogoutIcon />
          {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function PrescriptionIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
