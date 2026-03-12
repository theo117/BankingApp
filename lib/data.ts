export type Account = {
  id: string;
  name: string;
  type: "Checking" | "Savings" | "Investment" | "Loan";
  balance: number;
  available: number;
  iban: string;
  apr?: number;
  status: "Healthy" | "Watch" | "Due";
};

export type Transaction = {
  id: string;
  accountId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  direction: "credit" | "debit";
  status: "Completed" | "Pending" | "Flagged";
};

export type AutomationJob = {
  id: string;
  name: string;
  cadence: string;
  nextRun: string;
  impact: string;
  status: "Active" | "Attention" | "Paused";
};

export type DemoUser = {
  name: string;
  email: string;
  tier: string;
  region: string;
  totalBalance: number;
};

export const demoUser: DemoUser = {
  name: "Theo Maseko",
  email: "theo@northstar-demo.bank",
  tier: "Platinum Everyday",
  region: "Johannesburg Demo Branch",
  totalBalance: 257340.22,
};

export const accounts: Account[] = [
  {
    id: "acc-checking",
    name: "Northstar Everyday",
    type: "Checking",
    balance: 42580.42,
    available: 41880.42,
    iban: "NSD-001-445-8821",
    status: "Healthy",
  },
  {
    id: "acc-savings",
    name: "Velocity Savings",
    type: "Savings",
    balance: 182240.5,
    available: 182240.5,
    iban: "NSD-001-778-3412",
    apr: 5.8,
    status: "Healthy",
  },
  {
    id: "acc-investment",
    name: "Wealth Builder Vault",
    type: "Investment",
    balance: 53620.8,
    available: 51020.8,
    iban: "NSD-001-192-6634",
    apr: 8.2,
    status: "Watch",
  },
  {
    id: "acc-loan",
    name: "SmartDrive Auto Loan",
    type: "Loan",
    balance: -213400,
    available: 0,
    iban: "NSD-LOAN-449-1200",
    apr: 11.5,
    status: "Due",
  },
];

export const transactions: Transaction[] = [
  {
    id: "txn-1",
    accountId: "acc-checking",
    title: "Salary Deposit",
    category: "Income",
    amount: 67500,
    date: "2026-03-01",
    direction: "credit",
    status: "Completed",
  },
  {
    id: "txn-2",
    accountId: "acc-checking",
    title: "CityPower Utility Bill",
    category: "Bills",
    amount: -2450.25,
    date: "2026-03-08",
    direction: "debit",
    status: "Completed",
  },
  {
    id: "txn-3",
    accountId: "acc-savings",
    title: "Auto-save Sweep",
    category: "Automation",
    amount: 12500,
    date: "2026-03-02",
    direction: "credit",
    status: "Completed",
  },
  {
    id: "txn-4",
    accountId: "acc-investment",
    title: "ETF Portfolio Top-up",
    category: "Investments",
    amount: -4800,
    date: "2026-03-10",
    direction: "debit",
    status: "Pending",
  },
  {
    id: "txn-5",
    accountId: "acc-checking",
    title: "Card Spend: SkyRail Travel",
    category: "Transport",
    amount: -860.55,
    date: "2026-03-11",
    direction: "debit",
    status: "Completed",
  },
  {
    id: "txn-6",
    accountId: "acc-loan",
    title: "Loan Repayment",
    category: "Loans",
    amount: 6200,
    date: "2026-03-05",
    direction: "credit",
    status: "Completed",
  },
  {
    id: "txn-7",
    accountId: "acc-checking",
    title: "Wire Transfer to A. Naidoo",
    category: "Transfers",
    amount: -9500,
    date: "2026-03-12",
    direction: "debit",
    status: "Flagged",
  },
];

export const cards = [
  {
    id: "card-1",
    name: "Northstar Platinum Debit",
    number: "**** 4421",
    spendLimit: 20000,
    spent: 9420,
    status: "Virtual + Physical",
  },
  {
    id: "card-2",
    name: "Travel Virtual Card",
    number: "**** 1038",
    spendLimit: 12000,
    spent: 3820,
    status: "Online only",
  },
];

export const beneficiaries = [
  { name: "A. Naidoo", bank: "Demo National Bank", account: "0081244481" },
  { name: "Luna Fibre", bank: "Northstar Utilities", account: "FTTH-20912" },
  { name: "Metro Medical", bank: "HealthPay", account: "MED-11928" },
];

export const automationJobs: AutomationJob[] = [
  {
    id: "auto-1",
    name: "Salary split: checking to savings",
    cadence: "Monthly on the 2nd",
    nextRun: "2026-04-02 08:00",
    impact: "Moves R12,500 after payroll lands",
    status: "Active",
  },
  {
    id: "auto-2",
    name: "Loan repayment reminder",
    cadence: "5 days before due date",
    nextRun: "2026-03-20 09:30",
    impact: "Push + email reminder for R6,200 installment",
    status: "Active",
  },
  {
    id: "auto-3",
    name: "Suspicious transfer velocity rule",
    cadence: "Real-time",
    nextRun: "Watching now",
    impact: "Flags high-value rapid transfers for admin review",
    status: "Attention",
  },
  {
    id: "auto-4",
    name: "Dormant account sweep",
    cadence: "Weekly on Fridays",
    nextRun: "2026-03-13 18:00",
    impact: "Checks inactivity and nudges the customer success team",
    status: "Paused",
  },
];

export const monthlyGoals = [
  { label: "Emergency fund target", progress: 78, amount: "R78,000 / R100,000" },
  { label: "Travel budget", progress: 54, amount: "R10,800 / R20,000" },
  { label: "Debt payoff sprint", progress: 31, amount: "R18,600 / R60,000" },
];

export const adminMetrics = [
  { label: "Active demo customers", value: "18,240", delta: "+12.4%" },
  { label: "Payments processed today", value: "R14.2m", delta: "+4.8%" },
  { label: "Rules triggered", value: "36", delta: "6 need review" },
  { label: "Automations on schedule", value: "97.8%", delta: "2 paused" },
];

export const riskQueue = [
  {
    customer: "A. Naidoo",
    reason: "Three outbound transfers in 9 minutes",
    severity: "High",
    action: "Hold next transfer and call customer",
  },
  {
    customer: "J. Mokoena",
    reason: "Password reset + new device login",
    severity: "Medium",
    action: "Require OTP challenge",
  },
  {
    customer: "R. Ndlovu",
    reason: "Dormant account reactivated",
    severity: "Low",
    action: "Observe for 24 hours",
  },
];

export const serviceTickets = [
  {
    title: "Card pin reset",
    owner: "Branch Ops",
    eta: "Today 14:00",
    status: "In progress",
  },
  {
    title: "Proof of funds letter",
    owner: "Client Success",
    eta: "Today 16:30",
    status: "Queued",
  },
  {
    title: "Business account onboarding",
    owner: "Compliance",
    eta: "Tomorrow 10:00",
    status: "Reviewing",
  },
];

export const upcomingPayments = [
  {
    title: "Luna Fibre",
    amount: "R899.00",
    date: "2026-03-15",
    source: "Northstar Everyday",
  },
  {
    title: "SmartDrive Auto Loan",
    amount: "R6,200.00",
    date: "2026-03-25",
    source: "Northstar Everyday",
  },
  {
    title: "Metro Medical",
    amount: "R1,450.00",
    date: "2026-03-27",
    source: "Northstar Everyday",
  },
];

export const demoCredentials = [
  {
    role: "Primary customer",
    email: "theo@northstar-demo.bank",
    password: "DemoBank#2026",
  },
  {
    role: "Family account user",
    email: "ava@northstar-demo.bank",
    password: "DemoFamily#2026",
  },
  {
    role: "Admin operator",
    email: "ops@northstar-demo.bank",
    password: "AdminOps#2026",
  },
];

export function getAccountById(accountId: string) {
  return accounts.find((account) => account.id === accountId);
}
