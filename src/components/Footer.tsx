"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface FooterProps {
  version?: string;
}

export function Footer({ version = "1.0.0" }: FooterProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer className={`mt-auto py-4 border-t ${
      isDark 
        ? "border-white/10 bg-black/20" 
        : "border-gray-200 bg-gray-50"
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className={`text-center text-sm ${
          isDark ? "text-white/60" : "text-gray-500"
        }`}>
          <p>Inventory Tracker v{version} • Built with Next.js & Supabase</p>
          <p className="mt-1">
            © 2025 • 
            <span className="mx-1">🔒</span>
            Secure Cloud Inventory Management
          </p>
        </div>
      </div>
    </footer>
  );
}
