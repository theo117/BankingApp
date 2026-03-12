import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-lg rounded-[28px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Northstar Demo Bank</p>
        <h1 className="mt-3 text-3xl font-semibold">Account not found</h1>
        <p className="mt-3 text-sm text-slate-300">
          The account you requested is not available in the seeded demo data.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
