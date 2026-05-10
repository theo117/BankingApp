import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTransactionsByUserId } from "@/lib/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const transactions = getTransactionsByUserId(user.id, 500);
  const lines = [
    ["date", "title", "category", "account", "amount", "status", "counterparty", "reference"].join(","),
    ...transactions.map((transaction) =>
      [
        transaction.date.toISOString(),
        escapeCsv(transaction.title),
        escapeCsv(transaction.category),
        escapeCsv(transaction.accountName),
        transaction.amount.toFixed(2),
        escapeCsv(transaction.status),
        escapeCsv(transaction.counterparty ?? ""),
        escapeCsv(transaction.reference ?? ""),
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="northstar-statement-${toSafeFilename(user.name)}.csv"`,
    },
  });
}

function escapeCsv(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toSafeFilename(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "customer";
}
