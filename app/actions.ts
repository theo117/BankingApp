"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { consumeOtpFlow, createOtpFlow, createSession, destroySession, requireUser, verifyLogin } from "@/lib/auth";
import {
  createNotification,
  createRecurringTemplate,
  createBeneficiary,
  createDebitTransactionForUser,
  createLoanApplication,
  createUserWithStarterAccounts,
  getTransactionById,
  getTransactionOwnerUserId,
  toggleCardStatus,
  toggleAutomationJob,
  updateLoanApplicationStatus,
  updateTransactionStatus,
  reverseRejectedTransaction,
} from "@/lib/database";

function parsePositiveMoney(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? "").trim());
  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : null;
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  const number = Number(String(value ?? "").trim());
  return Number.isInteger(number) && number > 0 ? number : null;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    redirect("/login?error=invalid-credentials");
  }

  await createOtpFlow(user.email);
  redirect("/login/otp");
}

export async function otpAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    redirect("/login/otp?error=missing-code");
  }

  const user = await consumeOtpFlow(code);
  if (!user) {
    redirect("/login/otp?error=invalid-code");
  }

  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const region = String(formData.get("region") ?? "").trim() || "Remote Demo Branch";

  if (!name || !email || !password) {
    redirect("/login?error=signup-missing");
  }

  if (password.length < 8) {
    redirect("/login?error=signup-weak");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUserWithStarterAccounts({ name, email, passwordHash, region });

  if (!user) {
    redirect("/login?error=signup-exists");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function transferAction(formData: FormData) {
  const user = await requireUser();
  const fromAccountId = String(formData.get("fromAccountId") ?? "");
  const beneficiaryName = String(formData.get("beneficiaryName") ?? "").trim();
  const amount = parsePositiveMoney(formData.get("amount"));
  const reference = String(formData.get("reference") ?? "").trim() || "Transfer";

  if (!fromAccountId || !beneficiaryName || !amount) {
    redirect("/?message=invalid-transfer");
  }

  const result = createDebitTransactionForUser({
    userId: user.id,
    accountId: fromAccountId,
    title: `Transfer to ${beneficiaryName}`,
    category: "Transfers",
    amount,
    status: amount >= 9000 ? "Flagged" : "Completed",
    counterparty: beneficiaryName,
    reference,
  });

  if (!result.ok) {
    redirect("/?message=insufficient-funds");
  }

  createNotification({
    userId: user.id,
    title: "Transfer submitted",
    body: `Transfer to ${beneficiaryName} for ${amount.toFixed(2)} has been recorded.`,
  });

  revalidatePath("/");
  revalidatePath(`/accounts/${result.accountId}`);
  redirect("/?message=transfer-success");
}

export async function billPaymentAction(formData: FormData) {
  const user = await requireUser();
  const fromAccountId = String(formData.get("fromAccountId") ?? "");
  const billerName = String(formData.get("billerName") ?? "").trim();
  const amount = parsePositiveMoney(formData.get("amount"));
  const reference = String(formData.get("reference") ?? "").trim() || "Bill payment";

  if (!fromAccountId || !billerName || !amount) {
    redirect("/?message=invalid-bill");
  }

  const result = createDebitTransactionForUser({
    userId: user.id,
    accountId: fromAccountId,
    title: `Bill payment to ${billerName}`,
    category: "Bills",
    amount,
    status: "Completed",
    counterparty: billerName,
    reference,
  });

  if (!result.ok) {
    redirect("/?message=insufficient-funds");
  }

  createNotification({
    userId: user.id,
    title: "Bill payment completed",
    body: `Payment to ${billerName} for ${amount.toFixed(2)} completed successfully.`,
  });

  revalidatePath("/");
  revalidatePath(`/accounts/${result.accountId}`);
  redirect("/?message=bill-success");
}

export async function createBeneficiaryAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "").trim();
  const account = String(formData.get("account") ?? "").trim();

  if (!name || !bank || !account) {
    redirect("/?message=beneficiary-invalid");
  }

  createBeneficiary({ userId: user.id, name, bank, account });
  createNotification({
    userId: user.id,
    title: "Beneficiary added",
    body: `${name} was added to your saved beneficiaries.`,
  });
  revalidatePath("/");
  redirect("/?message=beneficiary-success");
}

export async function loanApplicationAction(formData: FormData) {
  const user = await requireUser();
  const amount = parsePositiveMoney(formData.get("amount"));
  const termMonths = parsePositiveInteger(formData.get("termMonths"));
  const purpose = String(formData.get("purpose") ?? "").trim();

  if (!amount || !termMonths || !purpose) {
    redirect("/?message=loan-invalid");
  }

  createLoanApplication({ userId: user.id, amount, termMonths, purpose });
  createNotification({
    userId: user.id,
    title: "Loan application submitted",
    body: `Your ${amount.toFixed(2)} application is under review.`,
  });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?message=loan-success");
}

export async function createRecurringTemplateAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const billerName = String(formData.get("billerName") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "").trim();
  const sourceAccountId = String(formData.get("sourceAccountId") ?? "");
  const amount = parsePositiveMoney(formData.get("amount"));

  if (!title || !billerName || !frequency || !sourceAccountId || !amount) {
    redirect("/?message=template-invalid");
  }

  const created = createRecurringTemplate({ userId: user.id, title, billerName, frequency, sourceAccountId, amount });
  if (!created) {
    redirect("/?message=template-invalid");
  }

  createNotification({
    userId: user.id,
    title: "Recurring bill saved",
    body: `${title} was saved as a ${frequency.toLowerCase()} payment template.`,
  });

  revalidatePath("/");
  redirect("/?message=template-success");
}

export async function toggleCardAction(formData: FormData) {
  const user = await requireUser();
  const cardId = String(formData.get("cardId") ?? "");
  const nextStatus = toggleCardStatus(cardId, user.id);

  if (!nextStatus) {
    redirect("/?message=card-missing");
  }

  revalidatePath("/");
  redirect(`/?message=${nextStatus === "Frozen" ? "card-frozen" : "card-active"}`);
}

export async function toggleAutomationAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  const nextStatus = toggleAutomationJob(jobId, user.id);

  if (!nextStatus) {
    redirect("/automation?message=job-missing");
  }

  revalidatePath("/automation");
  revalidatePath("/");
  redirect(`/automation?message=${nextStatus === "Active" ? "job-resumed" : "job-paused"}`);
}

export async function reviewFlaggedTransactionAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  const transactionId = String(formData.get("transactionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const transaction = getTransactionById(transactionId);

  if (!transaction || transaction.status !== "Flagged") {
    redirect("/admin?message=review-missing");
  }

  if (decision === "approve") {
    updateTransactionStatus(transactionId, "Completed");
    const ownerUserId = getTransactionOwnerUserId(transactionId);
    if (ownerUserId) {
      createNotification({
        userId: ownerUserId,
        title: "Flagged transfer approved",
        body: `${transaction.title} was approved by operations.`,
      });
    }
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/accounts/${transaction.accountId}`);
    redirect("/admin?message=review-approved");
  }

  if (decision === "reject") {
    const ownerUserId = getTransactionOwnerUserId(transactionId);
    reverseRejectedTransaction(transactionId);
    if (ownerUserId) {
      createNotification({
        userId: ownerUserId,
        title: "Flagged transfer rejected",
        body: `${transaction.title} was rejected and reversed by operations.`,
      });
    }
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/accounts/${transaction.accountId}`);
    redirect("/admin?message=review-rejected");
  }

  redirect("/admin?message=review-invalid");
}

export async function reviewLoanApplicationAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  const loanId = String(formData.get("loanId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const nextStatus = decision === "approve" ? "Approved" : decision === "decline" ? "Declined" : "";

  if (!nextStatus) {
    redirect("/admin?message=loan-review-invalid");
  }

  const loan = updateLoanApplicationStatus(loanId, nextStatus);
  if (!loan) {
    redirect("/admin?message=loan-review-missing");
  }

  createNotification({
    userId: loan.userId,
    title: `Loan ${nextStatus.toLowerCase()}`,
    body: `Your loan request for ${loan.amount.toFixed(2)} was ${nextStatus.toLowerCase()}.`,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin?message=${nextStatus === "Approved" ? "loan-approved" : "loan-declined"}`);
}
