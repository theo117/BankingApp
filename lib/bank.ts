import {
  getAccountByIdForUser,
  getAccountsByUserId,
  getAdminSummary,
  getAllFlaggedTransactions,
  getAllLoanApplications,
  getAutomationJobsByUserId,
  getBeneficiariesByUserId,
  getCardsByUserId,
  getLoanApplicationsByUserId,
  getNotificationsByUserId,
  getRecurringTemplatesByUserId,
  getTransactionsByAccountId,
  getTransactionDetailById,
  getTransactionsByUserId,
  getUserById,
} from "@/lib/database";

export async function getDashboardData(userId: string) {
  const user = getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const accounts = getAccountsByUserId(userId);
  const cards = getCardsByUserId(userId);
  const beneficiaries = getBeneficiariesByUserId(userId);
  const jobs = getAutomationJobsByUserId(userId);
  const transactions = getTransactionsByUserId(userId, 8);
  const loanApplications = getLoanApplicationsByUserId(userId);
  const notifications = getNotificationsByUserId(userId);
  const recurringTemplates = getRecurringTemplatesByUserId(userId);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const liquidBalance = accounts
    .filter((account) => account.type !== "Loan")
    .reduce((sum, account) => sum + account.balance, 0);
  const activeJobs = jobs.filter((job) => job.status === "Active").length;
  const spendByCategory = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] ?? 0) + Math.abs(transaction.amount);
      return totals;
    }, {});

  return {
    user,
    accounts,
    cards,
    beneficiaries,
    jobs,
    transactions,
    loanApplications,
    notifications,
    recurringTemplates,
    totalBalance,
    liquidBalance,
    activeJobs,
    spendByCategory,
  };
}

export async function getAccountDetail(accountId: string, userId: string) {
  const account = getAccountByIdForUser(accountId, userId);

  if (!account) {
    return null;
  }

  const transactions = getTransactionsByAccountId(account.id);
  const relatedAccounts = getAccountsByUserId(userId).filter((candidate) => candidate.id !== account.id).slice(0, 3);

  return { account, transactions, relatedAccounts };
}

export async function getAutomationData(userId: string) {
  const jobs = getAutomationJobsByUserId(userId);
  const accounts = getAccountsByUserId(userId);

  return { jobs, accounts };
}

export async function getAdminData() {
  const summary = getAdminSummary();
  const flaggedTransactions = getAllFlaggedTransactions();
  const loanApplications = getAllLoanApplications();
  const approvalRate =
    loanApplications.length === 0
      ? 0
      : Math.round(
          (loanApplications.filter((loan) => loan.status === "Approved").length / loanApplications.length) * 100,
        );

  return {
    ...summary,
    flaggedTransactions,
    loanApplications,
    analytics: {
      approvalRate,
      openLoans: loanApplications.filter((loan) => loan.status === "Under Review").length,
      rejectedLoans: loanApplications.filter((loan) => loan.status === "Declined").length,
    },
  };
}

export async function getTransactionReceipt(transactionId: string, userId: string, isAdmin: boolean) {
  return getTransactionDetailById(transactionId, isAdmin ? undefined : userId);
}
