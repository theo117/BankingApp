import { AppShell } from "@/components/app-shell";
import { ProgressBar, SectionCard, StatusBadge } from "@/components/ui";
import { toggleAutomationAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getAutomationData } from "@/lib/bank";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const automationIdeas = [
  { label: "Recurring transfers", progress: 92 },
  { label: "Fraud detection rules", progress: 84 },
  { label: "Statement delivery", progress: 96 },
  { label: "Customer nudges", progress: 73 },
];

function getMessageLabel(message?: string) {
  switch (message) {
    case "job-paused":
      return "Automation job paused and saved.";
    case "job-resumed":
      return "Automation job resumed and saved.";
    case "job-missing":
      return "That automation rule no longer exists.";
    default:
      return null;
  }
}

export default async function AutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { jobs, accounts } = await getAutomationData(user.id);
  const { message } = await searchParams;
  const messageLabel = getMessageLabel(message);

  const timeline = jobs.map((job) => ({
    time: job.nextRun.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    event: job.name,
  }));

  return (
    <AppShell
      eyebrow="Automation Center"
      title="Run banking workflows on rails"
      subtitle="These jobs live in the database, can be paused or resumed, and show the kind of operational automation a real banking product needs."
      user={user}
    >
      {messageLabel ? (
        <div className="mb-6 rounded-[22px] border border-cyan-300/20 bg-cyan-300/8 px-5 py-4 text-sm text-cyan-100">
          {messageLabel}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Scheduled jobs">
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{job.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{job.cadence}</p>
                    <p className="mt-4 text-sm text-slate-300">{job.impact}</p>
                    <p className="mt-3 text-sm text-slate-400">
                      Source: {job.sourceName ?? "General"} {job.amount ? `| ${formatCurrency(job.amount)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <StatusBadge status={job.status} />
                    <form action={toggleAutomationAction}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-cyan-300/40"
                      >
                        {job.status === "Paused" ? "Resume" : "Pause"}
                      </button>
                    </form>
                  </div>
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                  Next run: {formatDate(job.nextRun.toISOString())}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Automation health">
            <div className="space-y-5">
              {automationIdeas.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.progress}%</p>
                  </div>
                  <ProgressBar value={item.progress} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Daily execution timeline">
            <div className="space-y-3">
              {timeline.map((entry) => (
                <div key={`${entry.time}-${entry.event}`} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">{entry.time}</p>
                  <p className="mt-2 text-sm text-slate-200">{entry.event}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Funding sources">
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">{account.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{account.type}</p>
                  <p className="mt-3 text-lg font-semibold">{formatCurrency(account.available)}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
