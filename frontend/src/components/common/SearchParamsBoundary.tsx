"use client";

import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface SearchParamsBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function DefaultFallback() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function SearchParamsBoundary({
  children,
  fallback,
}: SearchParamsBoundaryProps) {
  return (
    <Suspense fallback={fallback ?? <DefaultFallback />}>
      {children}
    </Suspense>
  );
}
