import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MEIL GHG Emissions Platform | SEBI BRSR Principle 6",
  description:
    "Enterprise Greenhouse Gas Accounting and Evidence Verification Platform for Megha Engineering & Infrastructures Ltd.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <ClerkProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </ClerkProvider>
      </body>
    </html>
  );
}
