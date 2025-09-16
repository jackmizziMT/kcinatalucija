"use client";

import { ComponentProps } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function Label(props: ComponentProps<"label">) {
  return <label {...props} className={`flex flex-col gap-1 text-sm ${props.className ?? ""}`.trim()} />;
}

export function Input(props: ComponentProps<"input">) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <input 
      {...props} 
      className={`border rounded-lg p-3 md:p-3 text-base transition-colors ${
        isDark 
          ? "border-white/20 bg-white/10 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40" 
          : "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-gray-400"
      } ${props.className ?? ""}`.trim()} 
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <select 
      {...props} 
      className={`border rounded-lg p-3 md:p-3 text-base transition-colors ${
        isDark 
          ? "border-white/20 bg-white/10 text-white focus:bg-white/20 focus:border-white/40" 
          : "border-gray-300 bg-white text-gray-900 focus:bg-gray-50 focus:border-gray-400"
      } ${props.className ?? ""}`.trim()} 
    />
  );
}

export function Button({ variant = "default", ...props }: ComponentProps<"button"> & { variant?: "default" | "primary" | "danger" | "muted" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const base = "border rounded-lg p-3 md:p-3 active:scale-[.99] disabled:cursor-not-allowed transition-colors text-base font-medium";
  
  const styles: Record<string, string> = {
    default: isDark 
      ? `${base} border-white/20 bg-white/10 text-white hover:bg-white/20`
      : `${base} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`,
    primary: `${base} bg-[var(--primary)] text-white hover:bg-[var(--primary2)] disabled:bg-gray-600`,
    danger: `${base} text-white bg-[var(--danger)] hover:bg-red-600 disabled:bg-gray-600`,
    muted: isDark 
      ? `${base} border-white/20 bg-white/5 text-white/90 hover:bg-white/15`
      : `${base} border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200`,
  };
  
  const className = `${styles[variant] ?? styles.default} ${props.className ?? ""}`.trim();
  return <button {...props} className={className} />;
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between">
      <h2 className={`text-lg md:text-xl font-semibold ${
        isDark ? "text-white" : "text-gray-900"
      }`}>{title}</h2>
      {action}
    </div>
  );
}


