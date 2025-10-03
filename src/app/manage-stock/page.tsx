"use client";

import { ProductAdjuster } from "@/components/ProductAdjuster";
import { AuthGuard } from "@/components/AuthGuard";
import { useTheme } from "@/contexts/ThemeContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export default function ManageStockPage() {
  return (
    <AuthGuard allowViewer={true}>
      <ManageStockContent />
    </AuthGuard>
  );
}

function ManageStockContent() {
  const { theme } = useTheme();
  const { user } = useSupabaseAuth();
  const isDark = theme === "dark";
  const canEdit = user?.role !== 'viewer';

  return (
    <main className="space-y-6 md:space-y-8">
      <div className={`relative overflow-hidden rounded-xl border p-4 md:p-5 backdrop-blur-sm ${
        isDark 
          ? "border-white/20 bg-gradient-to-r from-white/5 to-white/10" 
          : "border-gray-200 bg-gradient-to-r from-gray-50 to-white"
      }`}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--primary)]/20 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[var(--accent)]/20 rounded-full translate-y-8 -translate-x-8"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Manage Stock</h1>
              <p className={`text-base md:text-lg ${isDark ? "text-white/90" : "text-gray-700"}`}>Adjust inventory quantities across all locations.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[var(--primary)]"></span>
              <span className="inline-block h-3 w-3 rounded-full bg-[var(--primary2)]"></span>
              <span className="inline-block h-3 w-3 rounded-full bg-[var(--accent)]"></span>
              <span className="inline-block h-3 w-3 rounded-full bg-[var(--danger)]"></span>
            </div>
          </div>
        </div>
      </div>
      <ProductAdjuster canEdit={canEdit} />
    </main>
  );
}
