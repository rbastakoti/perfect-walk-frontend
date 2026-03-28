import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const bodySans = DM_Sans({ variable: "--font-body", subsets: ["latin"] });
const headingSerif = Fraunces({ variable: "--font-heading", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Perfect Walk",
  description: "Your burnout-aware walk companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${bodySans.variable} ${headingSerif.variable} antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
