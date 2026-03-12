import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTransactionReceipt } from "@/lib/bank";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const user = await requireUser();
  const { transactionId } = await params;
  const receipt = await getTransactionReceipt(transactionId, user.id, user.role === "ADMIN");

  if (!receipt) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass rounded-[32px] p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Transaction Receipt</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{receipt.title}</h1>
            <p className="mt-2 text-sm text-slate-300">
              {receipt.userName} | {receipt.accountName}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
            Use browser print
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Amount</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(receipt.amount)}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-3xl font-semibold">{receipt.status}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Category</p>
            <p className="mt-2 text-lg font-semibold">{receipt.category}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Counterparty</p>
            <p className="mt-2 text-lg font-semibold">{receipt.counterparty ?? "Northstar Demo Bank"}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Reference</p>
            <p className="mt-2 text-lg font-semibold">{receipt.reference ?? "Not supplied"}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Date</p>
            <p className="mt-2 text-lg font-semibold">{formatDate(receipt.date.toISOString())}</p>
          </div>
        </div>

        <Link
          href={user.role === "ADMIN" ? "/admin" : "/"}
          className="mt-8 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
        >
          Return
        </Link>
      </div>
    </main>
  );
}
