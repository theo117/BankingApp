import { AppShell } from "@/components/app-shell";
import { reviewFlaggedTransactionAction, reviewLoanApplicationAction } from "@/app/actions";
import { SectionCard, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/bank";
import { riskQueue, serviceTickets } from "@/lib/data";
import { formatCompactCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function getMessageLabel(message?: string) {
  switch (message) {
    case "review-approved":
      return "Flagged transaction approved.";
    case "review-rejected":
      return "Flagged transaction rejected and reversed.";
    case "review-missing":
      return "That flagged transaction could not be found.";
    case "review-invalid":
      return "Choose a valid review action.";
    case "loan-approved":
      return "Loan application approved.";
    case "loan-declined":
      return "Loan application declined.";
    case "loan-review-missing":
      return "That loan application could not be found.";
    case "loan-review-invalid":
      return "Choose a valid loan review action.";
    default:
      return null;
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireAdmin();
  const admin = await getAdminData();
  const { message } = await searchParams;
  const messageLabel = getMessageLabel(message);

  const metrics = [
    { label: "Active demo customers", value: String(admin.customerCount), delta: "Seeded customer profiles" },
    { label: "Payments processed", value: formatCompactCurrency(admin.paymentsProcessed), delta: "Completed transaction volume" },
    { label: "Flagged items", value: String(admin.flaggedCount), delta: "Requires operations review" },
    { label: "Active automations", value: String(admin.jobCount), delta: "Currently enabled jobs" },
    { label: "Loan approval rate", value: `${admin.analytics.approvalRate}%`, delta: `${admin.analytics.openLoans} open reviews` },
    { label: "Declined loans", value: String(admin.analytics.rejectedLoans), delta: "Historical declines" },
  ];

  return (
    <AppShell
      eyebrow="Admin Console"
      title="Operations, controls, and fraud oversight"
      subtitle="Admin mode is now protected behind a real login and shows database-backed counts for customers, payments, flagged transfers, and automation jobs."
      user={user}
    >
      {messageLabel ? (
        <div className="mb-6 rounded-[22px] border border-cyan-300/20 bg-cyan-300/8 px-5 py-4 text-sm text-cyan-100">
          {messageLabel}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass rounded-[24px] p-5">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
            <p className="mt-2 text-sm text-cyan-200">{metric.delta}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Risk and fraud queue">
          <div className="space-y-3">
            {admin.flaggedTransactions.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{item.userName}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.accountName}</p>
                  </div>
                  <StatusBadge status="Flagged" />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {item.title} for {formatCompactCurrency(Math.abs(item.amount))}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                  {formatDate(item.date.toISOString())}
                </p>
                <div className="mt-4 flex gap-3">
                  <form action={reviewFlaggedTransactionAction}>
                    <input type="hidden" name="transactionId" value={item.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button
                      type="submit"
                      className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={reviewFlaggedTransactionAction}>
                    <input type="hidden" name="transactionId" value={item.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <button
                      type="submit"
                      className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {admin.flaggedTransactions.length === 0
              ? riskQueue.map((item) => (
              <div key={item.customer} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{item.customer}</p>
                  <span className="badge bg-rose-400/15 text-rose-100">{item.severity}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{item.reason}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                  Action: {item.action}
                </p>
              </div>
                ))
              : null}
          </div>
        </SectionCard>

        <SectionCard title="Recent automation updates">
          <div className="space-y-3">
            {admin.jobs.map((job) => (
              <div key={job.id} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{job.name}</p>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-2 text-sm text-slate-400">{job.userName}</p>
                <p className="mt-3 text-sm text-slate-300">{job.impact}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                  Updated {formatDate(job.updatedAt.toISOString())}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Service operations">
          <div className="grid gap-3 md:grid-cols-3">
            {serviceTickets.map((ticket) => (
              <div key={ticket.title} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <p className="text-lg font-semibold">{ticket.title}</p>
                <p className="mt-2 text-sm text-slate-400">{ticket.owner}</p>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <span className="text-cyan-200">{ticket.eta}</span>
                  <span className="text-slate-300">{ticket.status}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Loan applications">
          <div className="grid gap-3 md:grid-cols-2">
            {admin.loanApplications.slice(0, 6).map((loan) => (
              <div key={loan.id} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{loan.userName}</p>
                  <StatusBadge status={loan.status === "Under Review" ? "Pending" : loan.status} />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {formatCompactCurrency(loan.amount)} over {loan.termMonths} months
                </p>
                <p className="mt-2 text-sm text-slate-400">{loan.purpose}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                  Submitted {formatDate(loan.createdAt.toISOString())}
                </p>
                {loan.status === "Under Review" ? (
                  <div className="mt-4 flex gap-3">
                    <form action={reviewLoanApplicationAction}>
                      <input type="hidden" name="loanId" value={loan.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <button
                        type="submit"
                        className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={reviewLoanApplicationAction}>
                      <input type="hidden" name="loanId" value={loan.id} />
                      <input type="hidden" name="decision" value="decline" />
                      <button
                        type="submit"
                        className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
