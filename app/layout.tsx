import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/layout/Navigation";
import { BackgroundCheckMonitorInit } from "@/components/BackgroundCheckMonitorInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Call Center Onboarding Tracker",
  description:
    "Manage call center agent onboarding from hiring through certification",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        <BackgroundCheckMonitorInit />
        <div className="flex h-screen overflow-hidden">
          <Navigation />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
