"use client";

import { useMemo, useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface ProductReportProps {
  selectedSku?: string;
  onSkuChange?: (sku: string) => void;
  showProductSelector?: boolean;
}

export function ProductReport({ selectedSku, onSkuChange, showProductSelector = true }: ProductReportProps) {
  const { items, locations, stockByLocation, addStock, deductStock } = useSupabaseInventoryStore();
  const { theme } = useTheme();
  const { user } = useSupabaseAuth();
  const [internalSelectedSku, setInternalSelectedSku] = useState(selectedSku || "");
  const [adjustingStocks, setAdjustingStocks] = useState<Record<string, boolean>>({});

  const itemList = useMemo(() => Object.values(items), [items]);
  const locationList = useMemo(() => Object.values(locations), [locations]);

  const currentSku = selectedSku || internalSelectedSku;
  const handleSkuChange = onSkuChange || setInternalSelectedSku;

  // Product-based report: show quantities across all locations for selected product
  const productReport = useMemo(() => {
    if (!currentSku) return [];
    return locationList.map(location => ({
      locationId: location.id,
      locationName: location.name,
      quantity: stockByLocation[`${currentSku}::${location.id}`] || 0
    }));
  }, [currentSku, locationList, stockByLocation]);

  const selectedItem = itemList.find(item => item.sku === currentSku);
  const isDark = theme === "dark";

  // Export function
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProductReport = () => {
    const exportData = productReport.map(item => ({
      Location: item.locationName,
      Quantity: item.quantity
    }));
    const productName = selectedItem?.name || "Unknown";
    const sku = selectedItem?.sku || "Unknown";
    exportToCSV(exportData, `Product_Report_${sku}_${productName}_${new Date().toISOString().split('T')[0]}`);
  };

  // Quick stock adjustment functions
  const canEdit = user?.role !== 'viewer';
  
  const handleQuickAdjust = async (locationId: string, operation: 'add' | 'deduct') => {
    if (!currentSku || !canEdit) return;
    
    const stockKey = `${currentSku}::${locationId}`;
    setAdjustingStocks(prev => ({ ...prev, [stockKey]: true }));
    
    try {
      if (operation === 'add') {
        await addStock(currentSku, locationId, 1, 'Quick add from home page');
      } else {
        const currentStock = stockByLocation[stockKey] || 0;
        if (currentStock > 0) {
          await deductStock(currentSku, locationId, 1, 'Quick deduct from home page');
        }
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
    } finally {
      setAdjustingStocks(prev => ({ ...prev, [stockKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Selection */}
      {showProductSelector && (
        <Card>
          <CardHeader 
            title="Product Report" 
            subtitle="Select a product to view inventory across all locations"
          />
          <CardBody>
            <div className="mb-4">
              <Select value={currentSku} onChange={(e) => handleSkuChange(e.target.value)} className="text-base">
                <option value="">👆 Select a product to view report</option>
                {itemList.length === 0 && <option value="">No items available</option>}
                {itemList.map((it) => (
                  <option key={it.sku} value={it.sku}>{`${it.sku} — ${it.name}`}</option>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Product Report Results */}
      {currentSku && selectedItem && (
        <Card>
          <CardHeader 
            title={`📦 ${selectedItem.name}`}
            subtitle={`SKU: ${selectedItem.sku} • Quantity Kind: ${selectedItem.quantityKind}`}
          />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className={`text-left border-b ${isDark ? "border-white/20" : "border-gray-200"}`}>
                    <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Location</th>
                    <th className={`p-3 font-semibold text-center ${isDark ? "text-white" : "text-gray-900"}`}>Quantity</th>
                    {canEdit && (
                      <th className={`p-3 font-semibold text-center ${isDark ? "text-white" : "text-gray-900"}`}>Quick Adjust</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {productReport.map((item) => {
                    const stockKey = `${currentSku}::${item.locationId}`;
                    const isAdjusting = adjustingStocks[stockKey];
                    return (
                      <tr key={item.locationId} className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                        <td className={`p-3 ${isDark ? "text-white" : "text-gray-900"}`}>{item.locationName}</td>
                        <td className="p-3 font-semibold text-[var(--primary)] text-center">{item.quantity}</td>
                        {canEdit && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleQuickAdjust(item.locationId, 'add')}
                                disabled={isAdjusting}
                                className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
                                  isAdjusting 
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : isDark
                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                                    : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                }`}
                                title="Add 1 item"
                              >
                                {isAdjusting ? "..." : "+"}
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item.locationId, 'deduct')}
                                disabled={isAdjusting || item.quantity === 0}
                                className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
                                  isAdjusting || item.quantity === 0
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : isDark
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                    : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                                }`}
                                title="Remove 1 item"
                              >
                                {isAdjusting ? "..." : "−"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 font-bold ${
                    isDark 
                      ? "border-[var(--primary)] bg-[var(--primary)]/10" 
                      : "border-[var(--primary)] bg-[var(--primary)]/5"
                  }`}>
                    <td className={`p-3 text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                      <span className="inline-flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Total
                      </span>
                    </td>
                    <td className="p-3 text-lg font-bold text-[var(--primary)] bg-[var(--primary)]/10 rounded-md text-center">
                      {productReport.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    {canEdit && (
                      <td className="p-3 text-center">
                        <div className={`text-xs ${isDark ? "text-white/60" : "text-gray-500"}`}>
                          {canEdit ? "Quick adjust" : ""}
                        </div>
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Export button at very bottom */}
            {productReport.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <div className="text-right">
                  <button
                    onClick={exportProductReport}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isDark 
                        ? "text-white/40 hover:text-white/60" 
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Show prompt when no product is selected */}
      {!currentSku && showProductSelector && (
        <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
          isDark 
            ? "border-white/20 bg-white/5" 
            : "border-gray-300 bg-gray-50"
        }`}>
          <div className="text-4xl mb-4">📊</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Select a Product to View Report
          </h3>
          <p className={`text-base ${isDark ? "text-white/70" : "text-gray-600"}`}>
            Choose a product from the dropdown above to see inventory levels across all locations.
          </p>
          <div className={`mt-4 text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
            💡 This gives you a complete overview of where your inventory is located
          </div>
        </div>
      )}
    </div>
  );
}
