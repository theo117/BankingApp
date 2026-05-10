import Link from "next/link";
import { logoutAction } from "@/app/actions";

export function AppShell({
  children,
  eyebrow,
  title,
  subtitle,
  user,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  user: {
    name: string;
    tier: string;
    email: string;
    role: string;
  };
}) {
  const navItems =
    user.role === "ADMIN"
      ? [{ href: "/admin", label: "Admin" }]
      : [
          { href: "/", label: "Dashboard" },
          { href: "/automation", label: "Automation" },
        ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="glass mb-6 rounded-[28px] px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              {subtitle}
            </p>
          </div>

          <div className="glass rounded-3xl border border-white/10 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Signed in as
            </p>
            <p className="mt-2 text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-slate-300">{user.tier}</p>
            <p className="mt-3 text-xs text-slate-400">{user.email}</p>
            <form action={logoutAction} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {children}
    </div>
  );
}
