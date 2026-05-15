"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className:
          "!bg-white !text-slate-900 !border-slate-200 dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700",
      }}
    />
  );
}
