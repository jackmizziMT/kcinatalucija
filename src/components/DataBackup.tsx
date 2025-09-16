"use client";

import { useState } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

export function DataBackup() {
  const { exportState, importItems, locations, stockByLocation, adjustments, transfers, auditTrail } = useInventoryStore();
  const { users } = useAuth();
  const { theme } = useTheme();
  const [importData, setImportData] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const isDark = theme === "dark";

  const exportAllData = () => {
    const allData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: exportState(),
      users: Object.values(users),
      metadata: {
        totalItems: Object.keys(exportState().items || {}).length,
        totalLocations: Object.keys(locations).length,
        totalStockEntries: Object.keys(stockByLocation).length,
        totalAdjustments: adjustments.length,
        totalTransfers: transfers.length,
        totalAuditRecords: auditTrail.length,
      }
    };

    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSuccess("Complete backup exported successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const exportItemsOnly = () => {
    const data = exportState();
    const itemsOnly = {
      timestamp: new Date().toISOString(),
      type: "items-only",
      items: Object.values(data.items || {}),
      locations: Object.values(locations),
    };

    const json = JSON.stringify(itemsOnly, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-items-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSuccess("Items exported successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleImport = () => {
    setError("");
    setSuccess("");

    try {
      const parsed = JSON.parse(importData);
      
      // Handle different import formats
      if (parsed.type === "items-only" && parsed.items) {
        // Import items only
        importItems(parsed.items);
        setSuccess("Items imported successfully!");
      } else if (parsed.data && parsed.data.items) {
        // Import full backup
        importItems(Object.values(parsed.data.items));
        setSuccess("Full backup imported successfully!");
      } else if (Array.isArray(parsed)) {
        // Handle direct array of items
        importItems(parsed);
        setSuccess("Items imported successfully!");
      } else {
        setError("Invalid data format. Please check your import file.");
        return;
      }
      
      setImportData("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Invalid JSON format. Please check your import data.");
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader 
        title="Data Backup & Restore" 
        subtitle="Export your data for safekeeping or import from backup files"
      />
      <CardBody>
        <div className="space-y-6">
          {/* Export Section */}
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-green-500/10 border-green-500/30" 
              : "bg-green-50 border-green-200"
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-green-300" : "text-green-800"}`}>
              📤 Export Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="primary"
                onClick={exportAllData}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Complete Backup
              </Button>
              <Button
                variant="muted"
                onClick={exportItemsOnly}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Items Only
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-blue-500/10 border-blue-500/30" 
              : "bg-blue-50 border-blue-200"
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-blue-300" : "text-blue-800"}`}>
              📥 Import Data
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    Import from File
                  </span>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="cursor-pointer"
                  />
                </Label>
              </div>

              <div>
                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    Or paste JSON data
                  </span>
                  <textarea
                    className={`w-full p-3 rounded-lg border text-sm font-mono resize-none ${
                      isDark 
                        ? "bg-black/20 border-white/20 text-white placeholder-white/50" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    rows={6}
                    placeholder="Paste your JSON backup data here..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                  />
                </Label>
              </div>

              <Button
                variant="primary"
                onClick={handleImport}
                disabled={!importData.trim()}
                className="w-full"
              >
                Import Data
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className={`p-3 rounded-lg border ${
              isDark 
                ? "bg-red-500/20 border-red-500/30 text-red-300" 
                : "bg-red-100 border-red-200 text-red-700"
            }`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`p-3 rounded-lg border ${
              isDark 
                ? "bg-green-500/20 border-green-500/30 text-green-300" 
                : "bg-green-100 border-green-200 text-green-700"
            }`}>
              {success}
            </div>
          )}

          {/* Info Section */}
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? "bg-yellow-500/10 border-yellow-500/30" 
              : "bg-yellow-50 border-yellow-200"
          }`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className={`text-sm font-semibold ${isDark ? "text-yellow-300" : "text-yellow-800"}`}>
                  Data Storage Information
                </h4>
                <p className={`text-xs mt-1 ${isDark ? "text-yellow-200" : "text-yellow-700"}`}>
                  Your data is currently stored locally in your browser. For permanent storage and sync across devices, 
                  consider setting up a database. Export your data regularly as a backup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
