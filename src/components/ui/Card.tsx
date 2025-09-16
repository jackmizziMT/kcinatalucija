"use client";

import { ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`rounded-xl border backdrop-blur-sm ${
      isDark 
        ? "border-white/20 bg-white/5" 
        : "border-gray-200 bg-white/80"
    } ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "p-4 md:p-5" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`p-4 md:p-5 border-b ${
      isDark ? "border-white/10" : "border-gray-200"
    }`}>
      <h2 className={`text-lg md:text-xl font-semibold ${
        isDark ? "text-white" : "text-gray-900"
      }`}>{title}</h2>
      {subtitle ? (
        <p className={`text-sm mt-1 ${
          isDark ? "text-white/80" : "text-gray-600"
        }`}>{subtitle}</p>
      ) : null}
    </div>
  );
}


