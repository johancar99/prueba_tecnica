import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, className = "", id, name, options, placeholder, ...props },
    ref
  ) => {
    const selectId = id ?? name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          name={name}
          className={[
            "rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors",
            "bg-white text-slate-900 dark:bg-slate-800/60 dark:text-slate-100",
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
        >
          {placeholder && (
            <option value="" className="bg-white dark:bg-slate-800">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-white dark:bg-slate-800"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
