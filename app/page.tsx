import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MetricCard, ProgressBar, SectionCard, StatusBadge } from "@/components/ui";
import {
  billPaymentAction,
  createBeneficiaryAction,
  createRecurringTemplateAction,
  loanApplicationAction,
  toggleCardAction,
  transferAction,
} from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/bank";
import { demoCredentials, monthlyGoals, upcomingPayments } from "@/lib/data";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function getMessageLabel(message?: string) {
  switch (message) {
    case "transfer-success":
      return "Transfer submitted and written to the database.";
    case "insufficient-funds":
      return "That transfer was blocked because the account has insufficient available funds.";
    case "invalid-transfer":
      return "Enter an account, beneficiary, and amount greater than zero.";
    case "bill-success":
      return "Bill payment completed and stored in the database.";
    case "invalid-bill":
      return "Choose an account, biller, and amount greater than zero.";
    case "card-frozen":
      return "Card was frozen successfully.";
    case "card-active":
      return "Card was reactivated successfully.";
    case "card-missing":
      return "That card could not be found.";
    case "beneficiary-success":
      return "New beneficiary added successfully.";
    case "beneficiary-invalid":
      return "Enter a name, bank, and account number for the beneficiary.";
    case "loan-success":
      return "Loan application submitted for admin review.";
    case "loan-invalid":
      return "Enter a valid loan amount, term, and purpose.";
    case "template-success":
      return "Recurring bill template saved successfully.";
    case "template-invalid":
      return "Enter a title, biller, amount, frequency, and source account.";
    default:
      return null;
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  const dashboard = await getDashboardData(user.id);
  const { message } = await searchParams;
  const messageLabel = getMessageLabel(message);
  const spendEntries = Object.entries(dashboard.spendByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxSpend = spendEntries[0]?.[1] ?? 1;

  return (
    <AppShell
      eyebrow="Northstar Demo Bank"
      title="Banking that feels complete from day one"
      subtitle="Balances, transfers, cards, automation, and admin support are now driven by a real SQLite-backed demo environment."
      user={dashboard.user}
    >
      {messageLabel ? (
        <div className="mb-6 rounded-[22px] border border-cyan-300/20 bg-cyan-300/8 px-5 py-4 text-sm text-cyan-100">
          {messageLabel}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Total balance"
              value={formatCurrency(dashboard.totalBalance)}
              helper="Live total across the logged-in customer profile"
            />
            <MetricCard
              label="Liquid funds"
              value={formatCompactCurrency(dashboard.liquidBalance)}
              helper="Checking, savings, and investment balances"
            />
            <MetricCard
              label="Automation rules"
              value={String(dashboard.activeJobs)}
              helper="Currently active persistent jobs"
            />
          </section>

          <SectionCard title="Accounts" action={{ label: "Automation center", href: "/automation" }}>
            <div className="grid gap-4 md:grid-cols-2">
              {dashboard.accounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/40 hover:bg-white/7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">{account.type}</p>
                      <h3 className="mt-2 text-xl font-semibold">{account.name}</h3>
                    </div>
                    <StatusBadge status={account.status} />
                  </div>

                  <p className="mt-5 text-3xl font-semibold tracking-tight">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Available {formatCurrency(account.available)}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                    {account.iban}
                  </p>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Transfer money">
            <form action={transferAction} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-300">
                  From account
                  <select
                    name="fromAccountId"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                    defaultValue={dashboard.accounts[0]?.id}
                  >
                    {dashboard.accounts
                      .filter((account) => account.type !== "Loan")
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.available)})
                        </option>
                      ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-300">
                  Beneficiary
                  <select
                    name="beneficiaryName"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                    defaultValue={dashboard.beneficiaries[0]?.name}
                  >
                    {dashboard.beneficiaries.map((beneficiary) => (
                      <option key={beneficiary.id} value={beneficiary.name}>
                        {beneficiary.name} ({beneficiary.bank})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.6fr_1fr_auto]">
                <label className="grid gap-2 text-sm text-slate-300">
                  Amount
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    name="amount"
                    placeholder="2500"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-300">
                  Reference
                  <input
                    type="text"
                    name="reference"
                    placeholder="School fees"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Send
                  </button>
                </div>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Recent activity" action={{ label: "Admin review", href: "/admin" }}>
            <div className="space-y-3">
              {dashboard.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{transaction.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {transaction.category} | {transaction.accountName} | {formatDate(transaction.date.toISOString())}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/transactions/${transaction.id}/receipt`}
                      className="text-sm font-semibold text-cyan-200"
                    >
                      Receipt
                    </Link>
                    <StatusBadge status={transaction.status} />
                    <p
                      className={`text-lg font-semibold ${
                        transaction.amount >= 0 ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Cards and controls">
              <div className="space-y-4">
                {dashboard.cards.map((card) => (
                  <div key={card.id} className="rounded-[24px] bg-gradient-to-br from-sky-400/25 to-emerald-400/10 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-sky-100/80">{card.name}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-white">
                          {card.number}
                        </p>
                      </div>
                      <StatusBadge status={card.status === "Frozen" ? "Paused" : "Active"} />
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-300">Spend this month</p>
                        <p className="mt-1 text-xl font-semibold">{formatCurrency(card.spent)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-300">Limit</p>
                        <p className="mt-1 text-xl font-semibold">{formatCurrency(card.spendLimit)}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-300">Status: {card.status}</p>
                      <form action={toggleCardAction}>
                        <input type="hidden" name="cardId" value={card.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-cyan-300/40"
                        >
                          {card.status === "Frozen" ? "Unfreeze" : "Freeze"}
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Goals and planning">
              <div className="space-y-5">
                {monthlyGoals.map((goal) => (
                  <div key={goal.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="font-medium text-white">{goal.label}</p>
                      <p className="text-sm text-slate-400">{goal.amount}</p>
                    </div>
                    <ProgressBar value={goal.progress} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Spending chart">
              <div className="space-y-4">
                {spendEntries.map(([category, amount]) => (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="font-medium text-white">{category}</p>
                      <p className="text-sm text-slate-400">{formatCurrency(-amount)}</p>
                    </div>
                    <ProgressBar value={(amount / maxSpend) * 100} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Loan applications">
              <form action={loanApplicationAction} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-300">
                    Amount
                    <input
                      type="number"
                      min="1000"
                      step="100"
                      name="amount"
                      placeholder="85000"
                      className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-slate-300">
                    Term in months
                    <input
                      type="number"
                      min="6"
                      step="6"
                      name="termMonths"
                      placeholder="36"
                      className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm text-slate-300">
                  Purpose
                  <input
                    type="text"
                    name="purpose"
                    placeholder="Home office upgrade"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
                >
                  Apply for a loan
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {dashboard.loanApplications.slice(0, 3).map((loan) => (
                  <div key={loan.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                      <StatusBadge status={loan.status === "Under Review" ? "Pending" : loan.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{loan.termMonths} months | {loan.purpose}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Automation snapshot">
            <div className="space-y-3">
              {dashboard.jobs.map((job) => (
                <div key={job.id} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{job.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{job.cadence}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-4 text-sm text-slate-300">{job.impact}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    Next run: {formatDate(job.nextRun.toISOString())}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Upcoming payments">
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div key={payment.title} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{payment.title}</p>
                      <p className="text-sm text-slate-400">{payment.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{payment.amount}</p>
                      <p className="text-sm text-slate-400">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recurring bill templates">
            <form action={createRecurringTemplateAction} className="grid gap-4">
              <input
                type="text"
                name="title"
                placeholder="Monthly rent"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="billerName"
                  placeholder="Landlord or service provider"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  name="amount"
                  placeholder="4500"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  name="frequency"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  defaultValue="Monthly"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
                <select
                  name="sourceAccountId"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  defaultValue={dashboard.accounts[0]?.id}
                >
                  {dashboard.accounts
                    .filter((account) => account.type !== "Loan")
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40"
              >
                Save recurring template
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {dashboard.recurringTemplates.map((template) => (
                <div key={template.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{template.title}</p>
                    <p className="text-sm text-slate-400">{template.frequency}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {template.billerName} | {formatCurrency(template.amount)}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Pay a bill">
            <form action={billPaymentAction} className="grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                From account
                <select
                  name="fromAccountId"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  defaultValue={dashboard.accounts[0]?.id}
                >
                  {dashboard.accounts
                    .filter((account) => account.type !== "Loan")
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.available)})
                      </option>
                    ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                Biller
                <input
                  type="text"
                  name="billerName"
                  placeholder="Electricity, rent, school fees"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-300">
                  Amount
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    name="amount"
                    placeholder="899"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-300">
                  Reference
                  <input
                    type="text"
                    name="reference"
                    placeholder="March utility payment"
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
              >
                Pay bill
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Beneficiaries">
            <div className="space-y-3">
              {dashboard.beneficiaries.map((beneficiary) => (
                <div key={beneficiary.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">{beneficiary.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{beneficiary.bank}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    {beneficiary.account}
                  </p>
                </div>
              ))}
            </div>

            <form action={createBeneficiaryAction} className="mt-5 grid gap-3">
              <input
                type="text"
                name="name"
                placeholder="New beneficiary name"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
              />
              <input
                type="text"
                name="bank"
                placeholder="Bank name"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
              />
              <input
                type="text"
                name="account"
                placeholder="Account number"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
              />
              <button
                type="submit"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40"
              >
                Add beneficiary
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Demo login accounts">
            <div className="space-y-3">
              {demoCredentials.map((credential) => (
                <div key={credential.email} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">{credential.role}</p>
                  <p className="mt-2 text-sm text-slate-300">{credential.email}</p>
                  <p className="mt-1 text-sm text-cyan-200">{credential.password}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Statements">
            <Link
              href="/api/statements"
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40"
            >
              Download CSV statement
            </Link>
          </SectionCard>

          <SectionCard title="Notifications">
            <div className="space-y-3">
              {dashboard.notifications.map((notification) => (
                <div key={notification.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{notification.title}</p>
                    <StatusBadge status={notification.status === "Unread" ? "Pending" : "Completed"} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{notification.body}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    {formatDate(notification.createdAt.toISOString())}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
