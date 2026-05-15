import type { BackendRole } from "@/types/auth";

type Variant = "admin" | "doctor" | "patient" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  admin: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
  doctor: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  patient: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  success: "bg-green-500/15 text-green-400 ring-1 ring-green-500/30",
  warning: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  danger: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  neutral: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30",
};

export function roleToBadgeVariant(role: BackendRole): Variant {
  return role.toLowerCase() as Variant;
}

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
