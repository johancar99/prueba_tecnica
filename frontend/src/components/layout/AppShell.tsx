"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ThemeToggle from "@/components/common/ThemeToggle";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Sidebar — desktop */}
      <div className="hidden md:block">
        {mounted ? (
          <Sidebar />
        ) : (
          <div className="h-screen w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        )}
      </div>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          {/* Mobile hamburger — sidebar drawer (placeholder; sidebar always visible on md+) */}
          <div className="md:hidden">
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              MediScript
            </span>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
