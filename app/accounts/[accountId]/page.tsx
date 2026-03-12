import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SectionCard, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAccountDetail } from "@/lib/bank";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const user = await requireUser();
  const { accountId } = await params;
  const detail = await getAccountDetail(accountId, user.id);

  if (!detail) {
    notFound();
  }

  const { account, transactions, relatedAccounts } = detail;

  return (
    <AppShell
      eyebrow="Account Detail"
      title={account.name}
      subtitle={`Detailed view for ${account.type.toLowerCase()} activity, limits, and money movement for the logged-in customer.`}
      user={user}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Balance and details">
          <div className="rounded-[26px] bg-gradient-to-br from-cyan-400/20 via-sky-400/10 to-emerald-400/10 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-300">{account.type}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">{formatCurrency(account.balance)}</p>
              </div>
              <StatusBadge status={account.status} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-400">Available balance</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(account.available)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">APR / pricing</p>
                <p className="mt-1 text-xl font-semibold">{account.apr ? `${account.apr}%` : "Standard"}</p>
              </div>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.24em] text-slate-500">{account.iban}</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Transactions</p>
              <p className="mt-2 text-2xl font-semibold">{transactions.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Status</p>
              <p className="mt-2 text-2xl font-semibold">{account.status}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Updated</p>
              <p className="mt-2 text-2xl font-semibold">{formatDate(account.updatedAt.toISOString())}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Linked accounts">
          <div className="space-y-3">
            {relatedAccounts.map((relatedAccount) => (
              <Link
                key={relatedAccount.id}
                href={`/accounts/${relatedAccount.id}`}
                className="block rounded-[20px] border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40"
              >
                <p className="font-semibold">{relatedAccount.name}</p>
                <p className="mt-1 text-sm text-slate-400">{relatedAccount.type}</p>
                <p className="mt-3 text-lg font-semibold">{formatCurrency(relatedAccount.balance)}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Transactions">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{transaction.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {transaction.category} | {formatDate(transaction.date.toISOString())}
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
                  <p className="text-lg font-semibold">{formatCurrency(transaction.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
