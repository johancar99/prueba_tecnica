/** Card con soporte light/dark */
export function pageCardClass(extra = "") {
  return `rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${extra}`.trim();
}
