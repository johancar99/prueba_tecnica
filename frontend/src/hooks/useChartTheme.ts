"use client";

import { useTheme } from "next-themes";

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return {
    grid: isDark ? "#1e293b" : "#e2e8f0",
    axis: isDark ? "#1e293b" : "#cbd5e1",
    tick: isDark ? "#64748b" : "#94a3b8",
    tooltip: {
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
      borderRadius: "8px",
      color: isDark ? "#e2e8f0" : "#1e293b",
    },
    legend: isDark ? "#94a3b8" : "#64748b",
  };
}
