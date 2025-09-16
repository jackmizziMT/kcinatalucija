import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { ThemeHeader } from "@/components/ThemeHeader";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { SupabaseInitializer } from "@/components/SupabaseInitializer";
import { Footer } from "@/components/Footer";
import { APP_VERSION } from "@/lib/version";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventory Tracker",
  description: "Fast, mobile-first inventory management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <SupabaseAuthProvider>
            <SupabaseInitializer />
            <ThemeWrapper>
              <ThemeHeader />
              <main className="mx-auto max-w-2xl md:max-w-5xl px-4 md:px-6 py-4 md:py-6">
                {children}
              </main>
              <Footer version={APP_VERSION} />
            </ThemeWrapper>
          </SupabaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
