export default function Home() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "(NEXT_PUBLIC_API_BASE_URL no definida)";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Next.js (App Router)</h1>
      <p className="text-sm text-slate-400">
        API base (pública):{" "}
        <code className="rounded bg-slate-800 px-2 py-1 text-slate-200">
          {apiBase}
        </code>
      </p>
    </main>
  );
}
