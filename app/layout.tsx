import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { AuthProvider, AuthGuard } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Onboarding Tracker",
  description: "Track candidate onboarding progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthGuard>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main className="container mx-auto px-4 py-8">{children}</main>
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
