import { redirect } from "next/navigation";
import { otpAction } from "@/app/actions";
import { getCurrentUser, getOtpFlow } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function getErrorLabel(error?: string) {
  switch (error) {
    case "missing-code":
      return "Enter the OTP code to continue.";
    case "invalid-code":
      return "That OTP code was not valid or has expired.";
    default:
      return null;
  }
}

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/");
  }

  const challenge = await getOtpFlow();
  if (!challenge) {
    redirect("/login");
  }

  const { error } = await searchParams;
  const errorLabel = getErrorLabel(error);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass w-full rounded-[32px] p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Northstar Demo Bank</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white">Demo OTP challenge</h1>
        <p className="mt-3 max-w-xl text-sm text-slate-300">
          Password check passed for <span className="text-cyan-200">{challenge.email}</span>. Use the demo one-time code <span className="text-emerald-300">{env.demoOtpCode}</span> to finish signing in.
        </p>

        {errorLabel ? (
          <div className="mt-6 rounded-[20px] border border-rose-300/20 bg-rose-300/8 px-5 py-4 text-sm text-rose-100">
            {errorLabel}
          </div>
        ) : null}

        <form action={otpAction} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm text-slate-300">
            One-time code
            <input
              type="text"
              name="code"
              inputMode="numeric"
              placeholder="246810"
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Verify and continue
          </button>
        </form>
      </section>
    </main>
  );
}
