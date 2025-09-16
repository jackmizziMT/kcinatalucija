"use client";

import { useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";

export function DataPurge() {
  const { theme } = useTheme();
  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const isDark = theme === "dark";

  const purgeAllData = async () => {
    setIsPurging(true);
    setPurgeMessage("");
    
    try {
      console.log('Starting data purge...');
      
      // Delete all data from all tables in the correct order (respecting foreign keys)
      const tables = [
        'audit_trail',
        'stock_by_location', 
        'items',
        'locations',
        'app_users'
      ];
      
      for (const table of tables) {
        console.log(`Deleting from ${table}...`);
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          throw new Error(`Failed to delete from ${table}: ${error.message}`);
        }
      }
      
      // Reset the local store
      const { syncFromDatabase } = useSupabaseInventoryStore.getState();
      await syncFromDatabase();
      
      setPurgeMessage("✅ All data purged successfully! The app will refresh shortly.");
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error purging data:', error);
      setPurgeMessage(`❌ Error: ${error instanceof Error ? error.message : 'Failed to purge data'}`);
    } finally {
      setIsPurging(false);
      setShowConfirmation(false);
    }
  };

  return (
    <Card>
      <CardHeader 
        title="🗑️ Purge All Data" 
        subtitle="Delete all data from the database and start fresh"
      />
      <CardBody>
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-red-500/10 border-red-500/30" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className={`text-sm font-semibold ${isDark ? "text-red-300" : "text-red-800"}`}>
                  ⚠️ DANGER ZONE
                </h4>
                <p className={`text-xs mt-1 ${isDark ? "text-red-200" : "text-red-700"}`}>
                  This will permanently delete ALL data including items, locations, stock, audit trails, and users. 
                  This action cannot be undone!
                </p>
              </div>
            </div>
          </div>

          {!showConfirmation ? (
            <Button
              variant="danger"
              onClick={() => setShowConfirmation(true)}
              disabled={isPurging}
              className="w-full"
            >
              🗑️ Purge All Data
            </Button>
          ) : (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${
                isDark 
                  ? "bg-orange-500/20 border-orange-500/30 text-orange-300" 
                  : "bg-orange-100 border-orange-200 text-orange-700"
              }`}>
                <p className="text-sm font-medium">
                  Are you absolutely sure? Type "DELETE ALL" to confirm:
                </p>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type DELETE ALL"
                  className={`flex-1 px-3 py-2 rounded-md border text-sm ${
                    isDark 
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value === 'DELETE ALL') {
                      purgeAllData();
                    }
                  }}
                />
                <Button
                  variant="danger"
                  onClick={purgeAllData}
                  disabled={isPurging}
                >
                  {isPurging ? "Purging..." : "Confirm Purge"}
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isPurging}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {purgeMessage && (
            <div className={`p-3 rounded-lg border ${
              purgeMessage.includes("✅")
                ? isDark 
                  ? "bg-green-500/20 border-green-500/30 text-green-300" 
                  : "bg-green-100 border-green-200 text-green-700"
                : isDark 
                  ? "bg-red-500/20 border-red-500/30 text-red-300" 
                  : "bg-red-100 border-red-200 text-red-700"
            }`}>
              {purgeMessage}
            </div>
          )}

          <div className={`text-xs ${isDark ? "text-white/60" : "text-gray-500"}`}>
            <p><strong>Note:</strong> After purging, you'll need to recreate your admin user and basic setup.</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
