"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { ReactNode } from "react";

interface ThemeWrapperProps {
  children: ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div 
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? "text-white" : "text-gray-900"
      }`}
      style={{
        background: isDark ? '#1a1a1a' : '#f8fafc'
      }}
    >
      {children}
    </div>
  );
}
