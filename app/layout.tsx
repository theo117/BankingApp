import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: env.appName,
  description: "A full-featured demo banking platform with automation, admin tools, and seeded accounts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <footer className="px-4 pb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:px-6 lg:px-8">
          Powered by Teodor Dev Tech
        </footer>
      </body>
    </html>
  );
}
