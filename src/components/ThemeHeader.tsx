"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export function ThemeHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useSupabaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = theme === "dark";

  return (
    <header 
      className={`sticky top-0 z-10 border-b backdrop-blur-md ${
        isDark 
          ? "border-white/10 bg-black/60" 
          : "border-gray-200 bg-white/80"
      }`}
    >
      <div className="mx-auto max-w-2xl md:max-w-5xl px-4 md:px-6 h-12 flex items-center justify-between">
        <h1 className="text-base md:text-lg font-bold tracking-tight">
          <span className="text-[var(--primary)]">KTL</span> 
          <span className={isDark ? "text-white" : "text-gray-900"}> Stock</span>
        </h1>
        
        <div className="flex items-center gap-1 md:gap-2">
          {user && (
            <>
              {/* Navigation - hidden on small screens to save space */}
              <nav className="hidden md:flex items-center gap-1">
                <Link 
                  href="/" 
                  className={`px-2 py-1 rounded-md text-xs border border-transparent transition-colors ${
                    isDark 
                      ? "text-white hover:bg-white/10 hover:text-white hover:border-white/20" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/transfer" 
                  className={`px-2 py-1 rounded-md text-xs border border-transparent transition-colors ${
                    isDark 
                      ? "text-white hover:bg-white/10 hover:text-white hover:border-white/20" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  Transfer
                </Link>
                <Link 
                  href="/dashboard" 
                  className={`px-2 py-1 rounded-md text-xs border border-transparent transition-colors ${
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
                    className="px-3 py-2 rounded-md text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary2)] transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </nav>
              
              {/* Mobile hamburger menu */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-2 rounded-md border transition-colors ${
                    isDark 
                      ? "border-white/20 bg-white/10 text-white hover:bg-white/20" 
                      : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  title="Menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          )}
          
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md border transition-colors ${
              isDark 
                ? "border-white/20 bg-white/10 text-white hover:bg-white/20" 
                : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          {user && (
            <>
              {/* User info - hidden on small screens */}
              <div className={`hidden lg:flex items-center px-3 py-2 rounded-md text-sm ${
                isDark 
                  ? "bg-white/10 text-white border border-white/20" 
                  : "bg-gray-100 text-gray-700 border border-gray-300"
              }`}>
                <span className="text-xs opacity-75 mr-1">👤</span>
                <span className="font-medium">{user.username}</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  user.role === 'admin' 
                    ? "bg-purple-100 text-purple-700" 
                    : user.role === 'editor'
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {user.role}
                </span>
              </div>
              
              {/* Logout button - always visible */}
              <button
                onClick={signOut}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDark ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                }`}
                title="Logout"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-t ${
          isDark 
            ? "border-white/10 bg-black/80 backdrop-blur-md" 
            : "border-gray-200 bg-white/90 backdrop-blur-md"
        }`}>
          <div className="px-4 py-3 space-y-2">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isDark 
                  ? "text-white hover:bg-white/10" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏠 Home
            </Link>
            <Link 
              href="/transfer" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isDark 
                  ? "text-white hover:bg-white/10" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🚚 Transfer
            </Link>
            <Link 
              href="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isDark 
                  ? "text-white hover:bg-white/10" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📊 Reports
            </Link>
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isDark 
                    ? "text-white bg-[var(--primary)]/20 hover:bg-[var(--primary)]/30" 
                    : "text-gray-700 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ⚙️ Admin
              </Link>
            )}
            
            {/* Mobile user info */}
            <div className={`px-3 py-2 rounded-md text-sm ${
              isDark 
                ? "bg-white/5 text-white/80" 
                : "bg-gray-50 text-gray-600"
            }`}>
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span className="font-medium">{user?.username}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  user?.role === 'admin' 
                    ? "bg-purple-100 text-purple-700" 
                    : user?.role === 'editor'
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
