"use client";

import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export function ThemeHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === "dark";

  return (
    <header 
      className={`sticky top-0 z-10 border-b backdrop-blur-md ${
        isDark 
          ? "border-white/10 bg-black/60" 
          : "border-gray-200 bg-white/80"
      }`}
    >
      <div className="mx-auto max-w-2xl md:max-w-5xl px-4 md:px-6 h-14 flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight">
          <span className="text-[var(--primary)]">Kċina</span> 
          <span className={isDark ? "text-white" : "text-gray-900"}> ta' Luċija</span>
        </h1>
        
        <div className="flex items-center gap-1 md:gap-2">
          {user && (
            <nav className="flex items-center gap-1 md:gap-2">
            <Link 
              href="/" 
              className={`px-3 md:px-4 py-2 rounded-md text-sm md:text-base border border-transparent transition-colors ${
                isDark 
                  ? "text-white hover:bg-white/10 hover:text-white hover:border-white/20" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Home
            </Link>
            <Link 
              href="/transfer" 
              className={`px-3 md:px-4 py-2 rounded-md text-sm md:text-base border border-transparent transition-colors ${
                isDark 
                  ? "text-white hover:bg-white/10 hover:text-white hover:border-white/20" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Transfer
            </Link>
            <Link 
              href="/dashboard" 
              className={`px-3 md:px-4 py-2 rounded-md text-sm md:text-base border border-transparent transition-colors ${
                isDark 
                  ? "text-white hover:bg-white/10 hover:text-white hover:border-white/20" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Reports
            </Link>
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className="px-3 md:px-4 py-2 rounded-md text-sm md:text-base bg-[var(--primary)] text-white hover:bg-[var(--primary2)] transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
          )}
          
          <button
            onClick={toggleTheme}
            className={`ml-2 p-2 rounded-md border transition-colors ${
              isDark 
                ? "border-white/20 bg-white/10 text-white hover:bg-white/20" 
                : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? (
              // Sun icon for light mode
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          {user && (
            <button
              onClick={logout}
              className={`ml-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isDark ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
