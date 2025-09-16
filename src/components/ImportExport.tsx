"use client";

import Papa from "papaparse";
import { useRef } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { Item } from "@/lib/types";

export function ImportExport() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { importItems, exportState } = useInventoryStore();

  const handleImport = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const items: Item[] = [];
        for (const r of rows) {
          if (!r.sku || !r.name) continue;
          const costCents = Math.round(parseFloat(r.cost) * 100) || 0;
          const priceCents = Math.round(parseFloat(r.price) * 100) || 0;
          const quantityKind = (r.quantityKind === "kg" ? "kg" : "unit") as "unit" | "kg";
          items.push({ sku: r.sku, name: r.name, costPriceEuroCents: costCents, sellingPriceEuroCents: priceCents, quantityKind });
        }
        importItems(items);
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  };

  const handleExport = () => {
    const json = exportState();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border p-4 md:p-5 space-y-3 md:space-y-4 bg-white/60 dark:bg-black/30">
      <h2 className="text-base md:text-lg font-medium">Import / Export</h2>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-start sm:items-center">
        <input ref={fileRef} type="file" accept=".csv" className="border rounded-lg p-3 md:p-2" />
        <button className="border rounded-lg p-3 md:p-2" onClick={handleImport}>Import CSV (items)</button>
        <button className="border rounded-lg p-3 md:p-2" onClick={handleExport}>Export JSON (full state)</button>
      </div>
      <p className="text-xs text-gray-500">CSV headers: sku,name,cost,price,quantityKind</p>
    </div>
  );
}


