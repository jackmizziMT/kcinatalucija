"use client";

import { useState } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";
import { Item, Location } from "@/lib/types";

export function SupabaseMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState("");
  const [error, setError] = useState("");
  
  const localStore = useInventoryStore();
  const supabaseStore = useSupabaseInventoryStore();
  const { user: supabaseUser } = useSupabaseAuth();
  const { theme } = useTheme();
  
  const isDark = theme === "dark";

  const migrateToSupabase = async () => {
    setIsMigrating(true);
    setError("");
    setMigrationStatus("Starting migration...");

    try {
      // Step 1: Export local data
      setMigrationStatus("Exporting local data...");
      const localDataString = localStore.exportState();
      const localData = JSON.parse(localDataString);
      
      // Step 2: Import items to Supabase
      setMigrationStatus("Migrating items...");
      const items = Object.values(localData.items || {}) as Item[];
      if (items.length > 0) {
        await supabaseStore.importItems(items);
      }

      // Step 3: Import locations to Supabase
      setMigrationStatus("Migrating locations...");
      const locations = Object.values(localData.locations || {}) as Location[];
      for (const location of locations) {
        await supabaseStore.addLocation({ name: location.name });
      }

      // Step 4: Sync to get the new location IDs
      setMigrationStatus("Syncing data...");
      await supabaseStore.syncFromDatabase();

      // Step 5: Import stock data
      setMigrationStatus("Migrating stock data...");
      const stockEntries = Object.entries(localData.stockByLocation || {});
      for (const [key, quantity] of stockEntries) {
        const [sku, locationId] = key.split('::');
        const quantityNum = Number(quantity);
        
        // Find the new location ID by name
        const localLocation = localData.locations?.[locationId];
        if (localLocation) {
          const newLocation = Object.values(supabaseStore.locations).find(
            loc => loc.name === localLocation.name
          );
          
          if (newLocation && quantityNum > 0) {
            await supabaseStore.addStock(sku, newLocation.id, quantityNum, "migration", "Migrated from local storage");
          }
        }
      }

      setMigrationStatus("Migration completed successfully!");
      
      // Clear local storage after successful migration
      setTimeout(() => {
        localStorage.removeItem('inventory-tracker-store');
        setMigrationStatus("Local data cleared. Please refresh the page to use Supabase.");
      }, 2000);

    } catch (error) {
      console.error('Migration error:', error);
      setError(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  // Don't show migration if already using Supabase
  if (supabaseUser) {
    return null;
  }

  return (
    <Card>
      <CardHeader 
        title="🔄 Cloud Migration" 
        subtitle="Migrate your local data to Supabase for cloud storage"
      />
      <CardBody>
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-blue-500/10 border-blue-500/30" 
              : "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className={`text-sm font-semibold ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                  Cloud Storage Available
                </h4>
                <p className={`text-xs mt-1 ${isDark ? "text-blue-200" : "text-blue-700"}`}>
                  Your data is currently stored locally. Migrate to Supabase for cloud storage, 
                  real-time sync across devices, and automatic backups.
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-green-500/10 border-green-500/30" 
              : "bg-green-50 border-green-200"
          }`}>
            <h4 className={`text-sm font-semibold ${isDark ? "text-green-300" : "text-green-800"}`}>
              Local Data Available
            </h4>
            <p className={`text-xs mt-1 ${isDark ? "text-green-200" : "text-green-700"}`}>
              Local data found and ready for migration
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={migrateToSupabase}
              disabled={isMigrating}
              className="flex items-center gap-2"
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Migrating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Migrate to Cloud
                </>
              )}
            </Button>
          </div>

          {migrationStatus && (
            <div className={`p-3 rounded-lg border ${
              isDark 
                ? "bg-blue-500/20 border-blue-500/30 text-blue-300" 
                : "bg-blue-100 border-blue-200 text-blue-700"
            }`}>
              {migrationStatus}
            </div>
          )}

          {error && (
            <div className={`p-3 rounded-lg border ${
              isDark 
                ? "bg-red-500/20 border-red-500/30 text-red-300" 
                : "bg-red-100 border-red-200 text-red-700"
            }`}>
              {error}
            </div>
          )}

          <div className={`text-xs ${isDark ? "text-white/60" : "text-gray-500"}`}>
            <p><strong>Note:</strong> Migration will copy your data to Supabase and clear local storage. 
            Make sure to export a backup before migrating.</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
