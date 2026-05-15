import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, name, ...props }, ref) => {
    const inputId = id ?? name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={[
            "rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors",
            "bg-white text-slate-900 placeholder-slate-400",
            "dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder-slate-500",
            "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
