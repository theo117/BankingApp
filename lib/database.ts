import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { DatabaseSync } from "node:sqlite";
import { env } from "@/lib/env";

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  tier: string;
  region: string;
};

export type DbAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  available: number;
  iban: string;
  apr: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export type DbTransaction = {
  id: string;
  title: string;
  category: string;
  amount: number;
  direction: string;
  status: string;
  date: Date;
  counterparty: string | null;
  reference: string | null;
  accountId: string;
};

export type DbCard = {
  id: string;
  name: string;
  number: string;
  spendLimit: number;
  spent: number;
  status: string;
  userId: string;
};

export type DbBeneficiary = {
  id: string;
  name: string;
  bank: string;
  account: string;
  userId: string;
};

export type DbAutomationJob = {
  id: string;
  name: string;
  cadence: string;
  nextRun: Date;
  impact: string;
  status: string;
  amount: number | null;
  sourceName: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export type DbOtpChallenge = {
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
};

export type DbLoanApplication = {
  id: string;
  userId: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status: string;
  createdAt: Date;
};

export type DbNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  status: string;
  createdAt: Date;
};

export type DbRecurringTemplate = {
  id: string;
  userId: string;
  title: string;
  billerName: string;
  amount: number;
  frequency: string;
  sourceAccountId: string;
  createdAt: Date;
};

type SessionRow = {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
};

type DebitTransactionInput = {
  userId: string;
  accountId: string;
  title: string;
  category: string;
  amount: number;
  status: string;
  counterparty: string;
  reference: string;
};

let sqlite: DatabaseSync | null = null;

const db = {
  exec(sql: string) {
    return getDb().exec(sql);
  },
  prepare(sql: string) {
    return getDb().prepare(sql);
  },
};

function getDb() {
  if (sqlite) {
    return sqlite;
  }

  mkdirSync(env.dataDir, { recursive: true });

  sqlite = new DatabaseSync(env.dbPath);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA busy_timeout = 5000;");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      tier TEXT NOT NULL,
      region TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL,
      available REAL NOT NULL,
      iban TEXT NOT NULL UNIQUE,
      apr REAL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      direction TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      counterparty TEXT,
      reference TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      spend_limit REAL NOT NULL,
      spent REAL NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      bank TEXT NOT NULL,
      account TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS automation_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cadence TEXT NOT NULL,
      next_run TEXT NOT NULL,
      impact TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL,
      source_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otp_challenges (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loan_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      term_months INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recurring_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      biller_name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      source_account_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
  `);

  if (env.seedDemoData) {
    seedDatabase();
  }

  return sqlite;
}

function seedDatabase() {
  db.exec("BEGIN IMMEDIATE");

  try {
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (count.count > 0) {
      db.exec("COMMIT");
      return;
    }

    const now = new Date().toISOString();
    const theoId = randomUUID();
    const avaId = randomUUID();
    const adminId = randomUUID();
    const checkingId = randomUUID();
    const savingsId = randomUUID();
    const investmentId = randomUUID();
    const loanId = randomUUID();

    const createUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, tier, region)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    createUser.run(
      theoId,
      "theo@northstar-demo.bank",
      bcrypt.hashSync("DemoBank#2026", 10),
      "Theo Maseko",
      "CUSTOMER",
      "Platinum Everyday",
      "Johannesburg Demo Branch",
    );
    createUser.run(
      avaId,
      "ava@northstar-demo.bank",
      bcrypt.hashSync("DemoFamily#2026", 10),
      "Ava Maseko",
      "CUSTOMER",
      "Family Plus",
      "Cape Town Demo Branch",
    );
    createUser.run(
      adminId,
      "ops@northstar-demo.bank",
      bcrypt.hashSync("AdminOps#2026", 10),
      "Northstar Operations",
      "ADMIN",
      "Internal",
      "Central Operations",
    );

    const createAccount = db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, balance, available, iban, apr, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    createAccount.run(checkingId, theoId, "Northstar Everyday", "Checking", 42580.42, 41880.42, "NSD-001-445-8821", null, "Healthy", now, now);
    createAccount.run(savingsId, theoId, "Velocity Savings", "Savings", 182240.5, 182240.5, "NSD-001-778-3412", 5.8, "Healthy", now, now);
    createAccount.run(investmentId, theoId, "Wealth Builder Vault", "Investment", 53620.8, 51020.8, "NSD-001-192-6634", 8.2, "Watch", now, now);
    createAccount.run(loanId, theoId, "SmartDrive Auto Loan", "Loan", -213400, 0, "NSD-LOAN-449-1200", 11.5, "Due", now, now);

    const createTransaction = db.prepare(`
      INSERT INTO transactions (id, account_id, title, category, amount, direction, status, date, counterparty, reference, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seededTransactions = [
      [checkingId, "Salary Deposit", "Income", 67500, "credit", "Completed", "2026-03-01T08:15:00.000Z", "Northstar Payroll", "PAY-0301"],
      [checkingId, "CityPower Utility Bill", "Bills", -2450.25, "debit", "Completed", "2026-03-08T14:20:00.000Z", "CityPower", "BILL-5508"],
      [savingsId, "Auto-save Sweep", "Automation", 12500, "credit", "Completed", "2026-03-02T08:00:00.000Z", "Northstar Automation", "AUTO-1"],
      [investmentId, "ETF Portfolio Top-up", "Investments", -4800, "debit", "Pending", "2026-03-10T11:00:00.000Z", "Northstar Wealth", "ETF-2210"],
      [checkingId, "Card Spend: SkyRail Travel", "Transport", -860.55, "debit", "Completed", "2026-03-11T17:40:00.000Z", "SkyRail", "CARD-9982"],
      [loanId, "Loan Repayment", "Loans", 6200, "credit", "Completed", "2026-03-05T09:45:00.000Z", "Northstar Everyday", "LOAN-6200"],
      [checkingId, "Wire Transfer to A. Naidoo", "Transfers", -9500, "debit", "Flagged", "2026-03-12T12:00:00.000Z", "A. Naidoo", "WIRE-0091"],
    ];

    for (const [accountId, title, category, amount, direction, status, date, counterparty, reference] of seededTransactions) {
      createTransaction.run(
        randomUUID(),
        accountId,
        title,
        category,
        amount,
        direction,
        status,
        date,
        counterparty,
        reference,
        now,
      );
    }

    const createCard = db.prepare(`
      INSERT INTO cards (id, user_id, name, number, spend_limit, spent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    createCard.run(randomUUID(), theoId, "Northstar Platinum Debit", "**** 4421", 20000, 9420, "Virtual + Physical");
    createCard.run(randomUUID(), theoId, "Travel Virtual Card", "**** 1038", 12000, 3820, "Online only");

    const createBeneficiary = db.prepare(`
      INSERT INTO beneficiaries (id, user_id, name, bank, account)
      VALUES (?, ?, ?, ?, ?)
    `);

    createBeneficiary.run(randomUUID(), theoId, "A. Naidoo", "Demo National Bank", "0081244481");
    createBeneficiary.run(randomUUID(), theoId, "Luna Fibre", "Northstar Utilities", "FTTH-20912");
    createBeneficiary.run(randomUUID(), theoId, "Metro Medical", "HealthPay", "MED-11928");

    const createJob = db.prepare(`
      INSERT INTO automation_jobs (id, user_id, name, cadence, next_run, impact, status, amount, source_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    createJob.run(randomUUID(), theoId, "Salary split: checking to savings", "Monthly on the 2nd", "2026-04-02T08:00:00.000Z", "Moves R12,500 after payroll lands", "Active", 12500, "Northstar Everyday", now, now);
    createJob.run(randomUUID(), theoId, "Loan repayment reminder", "5 days before due date", "2026-03-20T09:30:00.000Z", "Push and email reminder for R6,200 installment", "Active", 6200, "Northstar Everyday", now, now);
    createJob.run(randomUUID(), theoId, "Suspicious transfer velocity rule", "Real-time", "2026-03-12T12:01:00.000Z", "Flags high-value rapid transfers for admin review", "Attention", null, "Fraud service", now, now);
    createJob.run(randomUUID(), theoId, "Dormant account sweep", "Weekly on Fridays", "2026-03-13T18:00:00.000Z", "Checks inactivity and nudges the customer success team", "Paused", null, "Operations", now, now);

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, body, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), theoId, "Welcome back", "Your demo banking workspace is ready.", "Unread", now);

    db.prepare(`
      INSERT INTO recurring_templates (id, user_id, title, biller_name, amount, frequency, source_account_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), theoId, "Monthly fibre", "Luna Fibre", 899, "Monthly", checkingId, now);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function mapUser(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    name: String(row.name),
    role: String(row.role),
    tier: String(row.tier),
    region: String(row.region),
  };
}

function mapAccount(row: Record<string, unknown>): DbAccount {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    balance: Number(row.balance),
    available: Number(row.available),
    iban: String(row.iban),
    apr: row.apr === null ? null : Number(row.apr),
    status: String(row.status),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    userId: String(row.user_id),
  };
}

function mapTransaction(row: Record<string, unknown>): DbTransaction {
  return {
    id: String(row.id),
    title: String(row.title),
    category: String(row.category),
    amount: Number(row.amount),
    direction: String(row.direction),
    status: String(row.status),
    date: new Date(String(row.date)),
    counterparty: row.counterparty ? String(row.counterparty) : null,
    reference: row.reference ? String(row.reference) : null,
    accountId: String(row.account_id),
  };
}

function mapCard(row: Record<string, unknown>): DbCard {
  return {
    id: String(row.id),
    name: String(row.name),
    number: String(row.number),
    spendLimit: Number(row.spend_limit),
    spent: Number(row.spent),
    status: String(row.status),
    userId: String(row.user_id),
  };
}

function mapBeneficiary(row: Record<string, unknown>): DbBeneficiary {
  return {
    id: String(row.id),
    name: String(row.name),
    bank: String(row.bank),
    account: String(row.account),
    userId: String(row.user_id),
  };
}

function mapAutomationJob(row: Record<string, unknown>): DbAutomationJob {
  return {
    id: String(row.id),
    name: String(row.name),
    cadence: String(row.cadence),
    nextRun: new Date(String(row.next_run)),
    impact: String(row.impact),
    status: String(row.status),
    amount: row.amount === null ? null : Number(row.amount),
    sourceName: row.source_name ? String(row.source_name) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    userId: String(row.user_id),
  };
}

function mapLoanApplication(row: Record<string, unknown>): DbLoanApplication {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    amount: Number(row.amount),
    termMonths: Number(row.term_months),
    purpose: String(row.purpose),
    status: String(row.status),
    createdAt: new Date(String(row.created_at)),
  };
}

function mapNotification(row: Record<string, unknown>): DbNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    body: String(row.body),
    status: String(row.status),
    createdAt: new Date(String(row.created_at)),
  };
}

function mapRecurringTemplate(row: Record<string, unknown>): DbRecurringTemplate {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    billerName: String(row.biller_name),
    amount: Number(row.amount),
    frequency: String(row.frequency),
    sourceAccountId: String(row.source_account_id),
    createdAt: new Date(String(row.created_at)),
  };
}

export function getUserByEmail(email: string) {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapUser(row) : null;
}

export function getUserById(userId: string) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  return row ? mapUser(row) : null;
}

export function createSessionRecord(userId: string, token: string, expiresAt: Date) {
  db.prepare(
    "INSERT INTO sessions (id, token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), token, userId, expiresAt.toISOString(), new Date().toISOString());
}

export function createOtpChallenge(email: string, code: string, expiresAt: Date) {
  db.prepare("DELETE FROM otp_challenges WHERE email = ?").run(email.toLowerCase());
  const id = randomUUID();
  db.prepare(
    "INSERT INTO otp_challenges (id, email, code, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, email.toLowerCase(), code, expiresAt.toISOString(), new Date().toISOString());
  return id;
}

export function getOtpChallengeById(challengeId: string) {
  const row = db
    .prepare("SELECT * FROM otp_challenges WHERE id = ?")
    .get(challengeId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    email: String(row.email),
    code: String(row.code),
    expiresAt: new Date(String(row.expires_at)),
  } satisfies DbOtpChallenge;
}

export function deleteOtpChallenge(challengeId: string) {
  db.prepare("DELETE FROM otp_challenges WHERE id = ?").run(challengeId);
}

export function getSessionWithUser(token: string) {
  const row = db
    .prepare(`
      SELECT s.id, s.token, s.user_id, s.expires_at,
             u.id as user_id_value, u.email, u.password_hash, u.name, u.role, u.tier, u.region
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `)
    .get(token) as (SessionRow & Record<string, unknown>) | undefined;

  if (!row) {
    return null;
  }

  return {
    session: {
      id: row.id,
      token: row.token,
      userId: row.user_id,
      expiresAt: new Date(String(row.expires_at)),
    },
    user: {
      id: String(row.user_id_value),
      email: String(row.email),
      passwordHash: String(row.password_hash),
      name: String(row.name),
      role: String(row.role),
      tier: String(row.tier),
      region: String(row.region),
    } satisfies DbUser,
  };
}

export function deleteSessionByToken(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function getAccountsByUserId(userId: string) {
  const rows = db
    .prepare("SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at ASC")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapAccount);
}

export function getCardsByUserId(userId: string) {
  const rows = db.prepare("SELECT * FROM cards WHERE user_id = ?").all(userId) as Record<string, unknown>[];
  return rows.map(mapCard);
}

export function getBeneficiariesByUserId(userId: string) {
  const rows = db
    .prepare("SELECT * FROM beneficiaries WHERE user_id = ?")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapBeneficiary);
}

export function getAutomationJobsByUserId(userId: string) {
  const rows = db
    .prepare("SELECT * FROM automation_jobs WHERE user_id = ? ORDER BY next_run ASC")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapAutomationJob);
}

export function getTransactionsByUserId(userId: string, limit = 8) {
  const rows = db
    .prepare(`
      SELECT t.*, a.name as account_name
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = ?
      ORDER BY t.date DESC
      LIMIT ?
    `)
    .all(userId, limit) as (Record<string, unknown> & { account_name: string })[];

  return rows.map((row) => ({
    ...mapTransaction(row),
    accountName: String(row.account_name),
  }));
}

export function getAccountByIdForUser(accountId: string, userId: string) {
  const row = db
    .prepare("SELECT * FROM accounts WHERE id = ? AND user_id = ?")
    .get(accountId, userId) as Record<string, unknown> | undefined;
  return row ? mapAccount(row) : null;
}

export function getTransactionsByAccountId(accountId: string) {
  const rows = db
    .prepare("SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC")
    .all(accountId) as Record<string, unknown>[];
  return rows.map(mapTransaction);
}

export function getTransactionDetailById(transactionId: string, userId?: string) {
  const row = db
    .prepare(`
      SELECT t.*, a.name as account_name, u.name as user_name
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      JOIN users u ON u.id = a.user_id
      WHERE t.id = ?
      ${userId ? "AND a.user_id = ?" : ""}
    `)
    .get(...(userId ? [transactionId, userId] : [transactionId])) as
    | (Record<string, unknown> & { account_name: string; user_name: string })
    | undefined;

  if (!row) {
    return null;
  }

  return {
    ...mapTransaction(row),
    accountName: String(row.account_name),
    userName: String(row.user_name),
  };
}

export function updateAccountBalances(accountId: string, balance: number, available: number) {
  db.prepare("UPDATE accounts SET balance = ?, available = ?, updated_at = ? WHERE id = ?").run(
    balance,
    available,
    new Date().toISOString(),
    accountId,
  );
}

export function createTransferTransaction(input: {
  accountId: string;
  title: string;
  category: string;
  amount: number;
  direction: string;
  status: string;
  counterparty: string;
  reference: string;
}) {
  db.prepare(`
    INSERT INTO transactions (id, account_id, title, category, amount, direction, status, date, counterparty, reference, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    input.accountId,
    input.title,
    input.category,
    input.amount,
    input.direction,
    input.status,
    new Date().toISOString(),
    input.counterparty,
    input.reference,
    new Date().toISOString(),
  );
}

export function createDebitTransactionForUser(input: DebitTransactionInput) {
  db.exec("BEGIN IMMEDIATE");

  try {
    const row = db
      .prepare("SELECT * FROM accounts WHERE id = ? AND user_id = ?")
      .get(input.accountId, input.userId) as Record<string, unknown> | undefined;

    if (!row) {
      db.exec("ROLLBACK");
      return { ok: false as const, reason: "account-missing" as const };
    }

    const account = mapAccount(row);
    if (account.available < input.amount) {
      db.exec("ROLLBACK");
      return { ok: false as const, reason: "insufficient-funds" as const };
    }

    const nextAvailable = Number((account.available - input.amount).toFixed(2));
    const nextBalance = Number((account.balance - input.amount).toFixed(2));
    updateAccountBalances(account.id, nextBalance, nextAvailable);
    createTransferTransaction({
      accountId: account.id,
      title: input.title,
      category: input.category,
      amount: -input.amount,
      direction: "debit",
      status: input.status,
      counterparty: input.counterparty,
      reference: input.reference,
    });

    db.exec("COMMIT");
    return { ok: true as const, accountId: account.id };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  status?: string;
}) {
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, body, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), input.userId, input.title, input.body, input.status ?? "Unread", new Date().toISOString());
}

export function toggleAutomationJob(jobId: string, userId: string) {
  const row = db
    .prepare("SELECT * FROM automation_jobs WHERE id = ? AND user_id = ?")
    .get(jobId, userId) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  const job = mapAutomationJob(row);
  const nextStatus = job.status === "Paused" ? "Active" : "Paused";
  db.prepare("UPDATE automation_jobs SET status = ?, updated_at = ? WHERE id = ?").run(
    nextStatus,
    new Date().toISOString(),
    jobId,
  );

  return nextStatus;
}

export function getAdminSummary() {
  const customerCountRow = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'")
    .get() as { count: number };
  const processedRow = db
    .prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'Completed'")
    .get() as { total: number };
  const flaggedRow = db
    .prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'Flagged'")
    .get() as { count: number };
  const jobCountRow = db
    .prepare("SELECT COUNT(*) as count FROM automation_jobs WHERE status = 'Active'")
    .get() as { count: number };

  const jobs = db
    .prepare(`
      SELECT aj.*, u.name as user_name
      FROM automation_jobs aj
      JOIN users u ON u.id = aj.user_id
      ORDER BY aj.updated_at DESC
      LIMIT 5
    `)
    .all() as (Record<string, unknown> & { user_name: string })[];

  return {
    customerCount: customerCountRow.count,
    paymentsProcessed: processedRow.total,
    flaggedCount: flaggedRow.count,
    jobCount: jobCountRow.count,
    jobs: jobs.map((row) => ({
      ...mapAutomationJob(row),
      userName: String(row.user_name),
    })),
  };
}

export function createUserWithStarterAccounts(input: {
  name: string;
  email: string;
  passwordHash: string;
  region: string;
}) {
  const existing = getUserByEmail(input.email);
  if (existing) {
    return null;
  }

  const userId = randomUUID();
  const now = new Date().toISOString();
  const slug = input.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(6, "X");

  db.exec("BEGIN IMMEDIATE");

  try {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, tier, region)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      input.email.toLowerCase(),
      input.passwordHash,
      input.name,
      "CUSTOMER",
      "Starter Everyday",
      input.region,
    );

    db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, balance, available, iban, apr, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, "Starter Current", "Checking", 15000, 15000, `NSD-${slug}-CUR`, null, "Healthy", now, now);

    db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, balance, available, iban, apr, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, "Starter Save", "Savings", 5000, 5000, `NSD-${slug}-SAV`, 4.2, "Healthy", now, now);

    db.prepare(`
      INSERT INTO cards (id, user_id, name, number, spend_limit, spent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, "Northstar Starter Debit", `**** ${String(Math.floor(Math.random() * 9000) + 1000)}`, 8000, 0, "Active");

    db.prepare(`
      INSERT INTO automation_jobs (id, user_id, name, cadence, next_run, impact, status, amount, source_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      userId,
      "Starter savings sweep",
      "Monthly on the 1st",
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      "Moves spare cash into savings after payday",
      "Active",
      1500,
      "Starter Current",
      now,
      now,
    );

    db.exec("COMMIT");
    return getUserById(userId);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getCardByIdForUser(cardId: string, userId: string) {
  const row = db
    .prepare("SELECT * FROM cards WHERE id = ? AND user_id = ?")
    .get(cardId, userId) as Record<string, unknown> | undefined;
  return row ? mapCard(row) : null;
}

export function createBeneficiary(input: { userId: string; name: string; bank: string; account: string }) {
  db.prepare(
    "INSERT INTO beneficiaries (id, user_id, name, bank, account) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), input.userId, input.name, input.bank, input.account);
}

export function getNotificationsByUserId(userId: string) {
  const rows = db
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 6")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapNotification);
}

export function createRecurringTemplate(input: {
  userId: string;
  title: string;
  billerName: string;
  amount: number;
  frequency: string;
  sourceAccountId: string;
}) {
  const sourceAccount = getAccountByIdForUser(input.sourceAccountId, input.userId);
  if (!sourceAccount || sourceAccount.type === "Loan") {
    return false;
  }

  db.prepare(`
    INSERT INTO recurring_templates (id, user_id, title, biller_name, amount, frequency, source_account_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    input.userId,
    input.title,
    input.billerName,
    input.amount,
    input.frequency,
    input.sourceAccountId,
    new Date().toISOString(),
  );
  return true;
}

export function getRecurringTemplatesByUserId(userId: string) {
  const rows = db
    .prepare("SELECT * FROM recurring_templates WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapRecurringTemplate);
}

export function toggleCardStatus(cardId: string, userId: string) {
  const card = getCardByIdForUser(cardId, userId);
  if (!card) {
    return null;
  }

  const nextStatus = card.status === "Frozen" ? "Active" : "Frozen";
  db.prepare("UPDATE cards SET status = ? WHERE id = ?").run(nextStatus, cardId);
  return nextStatus;
}

export function getAllFlaggedTransactions() {
  const rows = db
    .prepare(`
      SELECT t.*, a.name as account_name, a.user_id, u.name as user_name
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      JOIN users u ON u.id = a.user_id
      WHERE t.status = 'Flagged'
      ORDER BY t.date DESC
    `)
    .all() as (Record<string, unknown> & { account_name: string; user_name: string })[];

  return rows.map((row) => ({
    ...mapTransaction(row),
    accountName: String(row.account_name),
    userName: String(row.user_name),
  }));
}

export function getTransactionById(transactionId: string) {
  const row = db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .get(transactionId) as Record<string, unknown> | undefined;
  return row ? mapTransaction(row) : null;
}

export function getTransactionOwnerUserId(transactionId: string) {
  const row = db
    .prepare(`
      SELECT a.user_id
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE t.id = ?
    `)
    .get(transactionId) as { user_id?: string } | undefined;

  return row?.user_id ?? null;
}

export function updateTransactionStatus(transactionId: string, status: string) {
  db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(status, transactionId);
}

export function reverseRejectedTransaction(transactionId: string) {
  const transaction = getTransactionById(transactionId);
  if (!transaction || transaction.amount >= 0) {
    return null;
  }

  const account = db
    .prepare("SELECT * FROM accounts WHERE id = ?")
    .get(transaction.accountId) as Record<string, unknown> | undefined;

  if (!account) {
    return null;
  }

  const mappedAccount = mapAccount(account);
  const refund = Math.abs(transaction.amount);
  const nextBalance = Number((mappedAccount.balance + refund).toFixed(2));
  const nextAvailable = Number((mappedAccount.available + refund).toFixed(2));

  db.exec("BEGIN IMMEDIATE");
  try {
    updateAccountBalances(mappedAccount.id, nextBalance, nextAvailable);
    updateTransactionStatus(transaction.id, "Rejected");
    createTransferTransaction({
      accountId: mappedAccount.id,
      title: `Reversal for ${transaction.title}`,
      category: "Reversal",
      amount: refund,
      direction: "credit",
      status: "Completed",
      counterparty: transaction.counterparty ?? "Northstar Review Desk",
      reference: transaction.reference ?? "REVERSAL",
    });
    db.exec("COMMIT");
    return true;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createLoanApplication(input: {
  userId: string;
  amount: number;
  termMonths: number;
  purpose: string;
}) {
  db.prepare(`
    INSERT INTO loan_applications (id, user_id, amount, term_months, purpose, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), input.userId, input.amount, input.termMonths, input.purpose, "Under Review", new Date().toISOString());
}

export function getLoanApplicationsByUserId(userId: string) {
  const rows = db
    .prepare("SELECT * FROM loan_applications WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapLoanApplication);
}

export function getAllLoanApplications() {
  const rows = db
    .prepare(`
      SELECT la.*, u.name as user_name
      FROM loan_applications la
      JOIN users u ON u.id = la.user_id
      ORDER BY la.created_at DESC
    `)
    .all() as (Record<string, unknown> & { user_name: string })[];

  return rows.map((row) => ({
    ...mapLoanApplication(row),
    userName: String(row.user_name),
  }));
}

export function updateLoanApplicationStatus(loanId: string, status: string) {
  const row = db
    .prepare("SELECT * FROM loan_applications WHERE id = ?")
    .get(loanId) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  const loan = mapLoanApplication(row);
  db.prepare("UPDATE loan_applications SET status = ? WHERE id = ?").run(status, loanId);
  return loan;
}
