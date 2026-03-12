import { isAbsolute, join } from "node:path";

function getBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

const dataDir = process.env.BANKING_DATA_DIR?.trim()
  ? resolvePath(process.env.BANKING_DATA_DIR.trim())
  : join(process.cwd(), "data");

const dbPath = process.env.BANKING_DB_PATH?.trim()
  ? resolvePath(process.env.BANKING_DB_PATH.trim())
  : join(dataDir, "northstar.db");

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Northstar Demo Bank",
  demoOtpCode: process.env.BANKING_DEMO_OTP?.trim() || "246810",
  dataDir,
  dbPath,
  seedDemoData: getBooleanEnv("BANKING_SEED_DEMO", true),
};

function resolvePath(value: string) {
  return isAbsolute(value) ? value : join(process.cwd(), value);
}
