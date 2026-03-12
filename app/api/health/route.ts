import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: env.appName,
    databasePath: env.dbPath,
    seededDemoData: env.seedDemoData,
  });
}
