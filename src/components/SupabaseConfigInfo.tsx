"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useTheme } from "@/contexts/ThemeContext";

export function SupabaseConfigInfo() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Card>
      <CardHeader title="📧 Email Configuration" />
      <CardBody>
        <div className={`text-sm space-y-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          <p>
            <strong>Email Confirmation:</strong> If users are not receiving confirmation emails, 
            you may need to configure email settings in your Supabase project.
          </p>
          <div className={`p-3 rounded-lg border ${
            isDark 
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300" 
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}>
            <p className="font-medium mb-2">To disable email confirmation:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to Authentication → Settings</li>
              <li>Under "User Signups", disable "Enable email confirmations"</li>
              <li>Save the changes</li>
            </ol>
          </div>
          <div className={`p-3 rounded-lg border ${
            isDark 
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" 
              : "bg-yellow-50 border-yellow-200 text-yellow-700"
          }`}>
            <p className="font-medium mb-1">Alternative: Check Email Templates</p>
            <p className="text-xs">
              If you want to keep email confirmation enabled, check the "Email Templates" 
              section in Supabase to ensure confirmation emails are properly configured.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
