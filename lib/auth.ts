import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createOtpChallenge,
  createSessionRecord,
  deleteOtpChallenge,
  deleteSessionByToken,
  getOtpChallengeById,
  getSessionWithUser,
  getUserByEmail,
} from "@/lib/database";
import { env } from "@/lib/env";

const SESSION_COOKIE = "northstar-session";
const OTP_COOKIE = "northstar-otp";
const SESSION_TTL_DAYS = 7;

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  createSessionRecord(userId, token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    deleteSessionByToken(token);
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(OTP_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = getSessionWithUser(token);

  if (!session || session.session.expiresAt < new Date()) {
    if (session) {
      deleteSessionByToken(token);
    }
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}

export async function verifyLogin(email: string, password: string) {
  const user = getUserByEmail(email);

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function createOtpFlow(email: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const challengeId = createOtpChallenge(email, env.demoOtpCode, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(OTP_COOKIE, challengeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getOtpFlow() {
  const cookieStore = await cookies();
  const challengeId = cookieStore.get(OTP_COOKIE)?.value;

  if (!challengeId) {
    return null;
  }

  const challenge = getOtpChallengeById(challengeId);
  if (!challenge || challenge.expiresAt < new Date()) {
    if (challenge) {
      deleteOtpChallenge(challenge.id);
    }
    cookieStore.delete(OTP_COOKIE);
    return null;
  }

  return challenge;
}

export async function consumeOtpFlow(code: string) {
  const cookieStore = await cookies();
  const challengeId = cookieStore.get(OTP_COOKIE)?.value;
  if (!challengeId) {
    return null;
  }

  const challenge = getOtpChallengeById(challengeId);
  if (!challenge || challenge.expiresAt < new Date() || challenge.code !== code) {
    return null;
  }

  deleteOtpChallenge(challenge.id);
  cookieStore.delete(OTP_COOKIE);
  return getUserByEmail(challenge.email);
}

export async function requireOtpFlow() {
  const challenge = await getOtpFlow();
  if (!challenge) {
    redirect("/login");
  }
  return challenge;
}
