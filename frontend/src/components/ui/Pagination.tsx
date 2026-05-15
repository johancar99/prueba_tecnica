import type { PaginationMeta } from "@/types/users";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasNextPage, hasPrevPage } = meta;

  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav
      className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6"
      aria-label="Paginación"
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          label="Anterior"
        />
        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          label="Siguiente"
        />
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Página <span className="font-medium text-slate-800 dark:text-slate-200">{page}</span> de{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">{totalPages}</span>
        </p>

        <div className="flex items-center gap-1">
          <ChevronButton
            direction="left"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
          />

          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-sm text-slate-500">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={[
                  "min-w-[2rem] rounded px-2 py-1 text-sm font-medium transition-colors",
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}

          <ChevronButton
            direction="right"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
          />
        </div>
      </div>
    </nav>
  );
}

function buildPageList(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | "..."> = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}

function PageButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {label}
    </button>
  );
}

function ChevronButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      aria-label={direction === "left" ? "Página anterior" : "Página siguiente"}
    >
      {direction === "left" ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
