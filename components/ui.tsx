import Link from "next/link";

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-[28px] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        {action ? (
          <Link
            href={action.href}
            className="text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="glass rounded-[24px] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-emerald-300">{helper}</p>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-400"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Healthy: "bg-emerald-400/15 text-emerald-200",
    Active: "bg-emerald-400/15 text-emerald-200",
    Completed: "bg-emerald-400/15 text-emerald-200",
    Attention: "bg-amber-400/15 text-amber-100",
    Watch: "bg-amber-400/15 text-amber-100",
    Pending: "bg-amber-400/15 text-amber-100",
    Due: "bg-rose-400/15 text-rose-100",
    Flagged: "bg-rose-400/15 text-rose-100",
    Paused: "bg-slate-400/15 text-slate-200",
  };

  return <span className={`badge ${styles[status] ?? "bg-white/10 text-white"}`}>{status}</span>;
}
