"use client";

import Papa from "papaparse";
import { useRef, useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { Item } from "@/lib/types";
import { useTheme } from "@/contexts/ThemeContext";

export function ImportExport() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { importItems, exportState } = useSupabaseInventoryStore();
  const { theme } = useTheme();
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  
  const isDark = theme === "dark";

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage("Please select a CSV file first");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setIsImporting(true);
    setMessage("");

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data as any[];
            const items: Item[] = [];
            let validRows = 0;
            
            for (const r of rows) {
              if (!r.sku || !r.name) continue;
              const costCents = Math.round(parseFloat(r.cost || 0) * 100) || 0;
              const priceCents = Math.round(parseFloat(r.price || 0) * 100) || 0;
              const quantityKind = (r.quantityKind === "kg" ? "kg" : "unit") as "unit" | "kg";
              items.push({ 
                sku: r.sku.trim(), 
                name: r.name.trim(), 
                costPriceEuroCents: costCents, 
                sellingPriceEuroCents: priceCents, 
                quantityKind 
              });
              validRows++;
            }

            if (items.length === 0) {
              setMessage("No valid items found in CSV. Make sure you have 'sku' and 'name' columns.");
              return;
            }

            await importItems(items);
            setMessage(`✅ Successfully imported ${validRows} items from CSV`);
            
            // Clear the file input
            if (fileRef.current) fileRef.current.value = "";
            
            // Clear success message after 5 seconds
            setTimeout(() => setMessage(""), 5000);
          } catch (error) {
            console.error('Error importing items:', error);
            setMessage(`❌ Error importing items: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setTimeout(() => setMessage(""), 7000);
          } finally {
            setIsImporting(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setMessage(`❌ Error parsing CSV file: ${error.message}`);
          setIsImporting(false);
          setTimeout(() => setMessage(""), 7000);
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      setMessage(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsImporting(false);
      setTimeout(() => setMessage(""), 7000);
    }
  };

  const handleExport = () => {
    const state = exportState();
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg border ${
          message.includes("✅")
            ? isDark 
              ? "bg-green-500/20 border-green-500/30 text-green-300" 
              : "bg-green-100 border-green-200 text-green-700"
            : isDark 
              ? "bg-red-500/20 border-red-500/30 text-red-300" 
              : "bg-red-100 border-red-200 text-red-700"
        }`}>
          {message}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
        <input 
          ref={fileRef} 
          type="file" 
          accept=".csv" 
          className={`border rounded-lg p-3 text-base transition-colors ${
            isDark 
              ? "border-white/20 bg-white/10 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40" 
              : "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-gray-400"
          }`}
        />
        <button 
          className={`border rounded-lg p-3 text-base font-medium transition-colors ${
            isImporting
              ? isDark
                ? "border-white/20 bg-white/5 text-white/50 cursor-not-allowed"
                : "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
              : isDark
                ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import CSV (items)"}
        </button>
        <button 
          className={`border rounded-lg p-3 text-base font-medium transition-colors ${
            isDark 
              ? "border-white/20 bg-white/10 text-white hover:bg-white/20" 
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
          onClick={handleExport}
        >
          Export JSON (full state)
        </button>
      </div>
      
      <div className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
        <p><strong>CSV Format:</strong> sku,name,cost,price,quantityKind</p>
        <p><strong>Required:</strong> sku, name</p>
        <p><strong>Optional:</strong> cost (€), price (€), quantityKind (unit/kg)</p>
      </div>
    </div>
  );
}


