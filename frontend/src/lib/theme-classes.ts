/** Clases Tailwind reutilizables para modo claro / oscuro */

export const page = {
  title: "text-slate-900 dark:text-slate-100",
  subtitle: "text-slate-500 dark:text-slate-400",
};

export const card = {
  base: "rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  header: "border-b border-slate-200 dark:border-slate-800",
};

export const table = {
  wrap: "overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  head: "border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40",
  th: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
  row: "border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30",
  cell: "px-4 py-3 text-slate-500 dark:text-slate-400",
  cellStrong: "px-4 py-3 font-medium text-slate-800 dark:text-slate-200",
};

export const input = {
  native:
    "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:light] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:[color-scheme:dark]",
  label: "text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500",
};

export const btn = {
  ghost:
    "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200",
  outline:
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400",
};
