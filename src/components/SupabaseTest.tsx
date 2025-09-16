"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

export function SupabaseTest() {
  const [testResult, setTestResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      // Test with timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000);
      });
      
      const testPromise = supabase
        .from('locations')
        .select('*')
        .limit(1);

      const { data, error } = await Promise.race([testPromise, timeoutPromise]) as any;

      if (error) {
        setTestResult(`❌ Connection failed: ${error.message}`);
        return;
      }

      setTestResult(`✅ Connection successful! Found ${data?.length || 0} locations.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`❌ Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader 
        title="🔗 Supabase Connection Test" 
        subtitle="Test your Supabase database connection"
      />
      <CardBody>
        <div className="space-y-4">
          <Button
            variant="primary"
            onClick={testConnection}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Testing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test Connection
              </>
            )}
          </Button>

          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.startsWith('✅') 
                ? isDark 
                  ? "bg-green-500/20 border-green-500/30 text-green-300" 
                  : "bg-green-100 border-green-200 text-green-700"
                : isDark 
                  ? "bg-red-500/20 border-red-500/30 text-red-300" 
                  : "bg-red-100 border-red-200 text-red-700"
            }`}>
              {testResult}
            </div>
          )}

          <div className={`text-xs ${isDark ? "text-white/60" : "text-gray-500"}`}>
            <p><strong>Environment Variables:</strong></p>
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
