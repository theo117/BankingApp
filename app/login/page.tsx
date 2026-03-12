import { redirect } from "next/navigation";
import { loginAction, signupAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { demoCredentials } from "@/lib/data";

function getErrorLabel(error?: string) {
  switch (error) {
    case "invalid-credentials":
      return "Email or password was not correct.";
    case "missing-fields":
      return "Enter both your email and password.";
    case "signup-missing":
      return "Complete all signup fields to create a demo customer.";
    case "signup-weak":
      return "Choose a password with at least 8 characters.";
    case "signup-exists":
      return "That email already exists in the demo bank.";
    default:
      return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/");
  }

  const { error } = await searchParams;
  const errorLabel = getErrorLabel(error);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass rounded-[32px] p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Northstar Demo Bank</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Sign in to the live demo environment
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300">
            This version uses a real SQLite database, hashed passwords, a demo OTP step, persistent sessions, and database-backed transfers and automation jobs.
          </p>

          {errorLabel ? (
            <div className="mt-6 rounded-[20px] border border-rose-300/20 bg-rose-300/8 px-5 py-4 text-sm text-rose-100">
              {errorLabel}
            </div>
          ) : null}

          <form action={loginAction} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm text-slate-300">
              Email
              <input
                type="email"
                name="email"
                placeholder="theo@northstar-demo.bank"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Password
              <input
                type="password"
                name="password"
                placeholder="DemoBank#2026"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
              />
            </label>

            <button
              type="submit"
              className="mt-2 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Sign in
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <div className="glass rounded-[32px] p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Demo accounts</p>
            <div className="mt-5 space-y-4">
              {demoCredentials.map((credential) => (
                <div key={credential.email} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                  <p className="text-lg font-semibold">{credential.role}</p>
                  <p className="mt-3 text-sm text-slate-300">{credential.email}</p>
                  <p className="mt-1 text-sm text-cyan-200">{credential.password}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[32px] p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Create a new demo customer</p>
            <form action={signupAction} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Full name
                <input
                  type="text"
                  name="name"
                  placeholder="Sam North"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="sam@northstar-demo.bank"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-300">
                  Password
                  <input
                    type="password"
                    name="password"
                    placeholder="Choose a password"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-300">
                  Region
                  <input
                    type="text"
                    name="region"
                    placeholder="Durban Demo Branch"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
              >
                Create customer and sign in
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
