import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MEIL ESG Core",
  description:
    "Enterprise Greenhouse Gas Accounting and Evidence Verification Platform for Megha Engineering & Infrastructures Ltd.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
