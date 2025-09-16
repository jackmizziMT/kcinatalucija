"use client";

import { ImportExport } from "@/components/ImportExport";
import { LocationsManager } from "@/components/LocationsManager";
import { ItemsManager } from "@/components/ItemsManager";
import { UserManagement } from "@/components/UserManagement";
import { SecurityQuestionManager } from "@/components/SecurityQuestionManager";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function AdminPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <AdminContent />
    </AuthGuard>
  );
}

function AdminContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className="space-y-6 md:space-y-8">
      <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Admin</h1>
      <SecurityQuestionManager />
      <UserManagement />
      <ItemsManager />
      <LocationsManager />
      <Card>
        <CardHeader title="Batch Update" subtitle="Import CSV or export state" />
        <CardBody>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <Link
              href="/api/template/csv"
              className="px-4 py-3 rounded-lg border border-white/20 bg-[var(--primary)] text-white hover:bg-[var(--primary2)] text-base font-medium transition-colors"
            >
              Download CSV Template
            </Link>
            <Link
              href="/api/template/xls"
              className="px-4 py-3 rounded-lg border border-white/20 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 text-base font-medium transition-colors"
            >
              Download XLS Template
            </Link>
          </div>
          <ImportExport />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Help" />
        <CardBody>
          <p className={`text-base ${isDark ? "text-white/80" : "text-gray-600"}`}>Manage your catalogue, locations, users and import/export data here. Stock operations are available on the Home page.</p>
        </CardBody>
      </Card>
    </main>
  );
}


