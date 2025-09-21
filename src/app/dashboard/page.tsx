"use client";

import { useMemo, useState, useEffect } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { AuditRecord } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard allowViewer={true}>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { items, locations, stockByLocation, getAuditTrail } = useSupabaseInventoryStore();
  const { theme } = useTheme();
  const [reportType, setReportType] = useState<"location" | "product" | "audit">("location");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  
  // Audit report filters
  const [auditFilter, setAuditFilter] = useState<"today" | "week" | "month" | "date" | "range">("today");
  const [auditDate, setAuditDate] = useState("");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [auditTypeFilter, setAuditTypeFilter] = useState<"all" | "add" | "deduct" | "transfer">("all");
  const [auditSkuFilter, setAuditSkuFilter] = useState("");

  const itemList = useMemo(() => Object.values(items), [items]);
  const locationList = useMemo(() => Object.values(locations), [locations]);

  // Location-based report: show all items and quantities for selected location
  const locationReport = useMemo(() => {
    if (!selectedLocationId) return [];
    
    // If "All Locations" is selected, show all items across all locations
    if (selectedLocationId === "all") {
      const allItemsReport: Array<{
        sku: string;
        name: string;
        locationName: string;
        quantity: number;
      }> = [];
      
      itemList.forEach(item => {
        locationList.forEach(location => {
          const quantity = stockByLocation[`${item.sku}::${location.id}`] || 0;
          if (quantity > 0) {
            allItemsReport.push({
              sku: item.sku,
              name: item.name,
              locationName: location.name,
              quantity
            });
          }
        });
      });
      
      return allItemsReport;
    }
    
    // Single location report
    return itemList.map(item => ({
      sku: item.sku,
      name: item.name,
      locationName: "", // Empty for single location reports
      quantity: stockByLocation[`${item.sku}::${selectedLocationId}`] || 0
    })).filter(item => item.quantity > 0);
  }, [selectedLocationId, itemList, locationList, stockByLocation]);

  // Product-based report: show quantities across all locations for selected product
  const productReport = useMemo(() => {
    if (!selectedSku) return [];
    return locationList.map(location => ({
      locationId: location.id,
      locationName: location.name,
      quantity: stockByLocation[`${selectedSku}::${location.id}`] || 0
    }));
  }, [selectedSku, locationList, stockByLocation]);

  const selectedItem = itemList.find(item => item.sku === selectedSku);
  const isDark = theme === "dark";

  // Audit trail logic
  const getAuditFilters = () => {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (auditFilter) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "date":
        if (auditDate) {
          startDate = new Date(auditDate);
          endDate = new Date(auditDate);
          endDate.setDate(endDate.getDate() + 1);
        }
        break;
      case "range":
        if (auditStartDate) startDate = new Date(auditStartDate);
        if (auditEndDate) {
          endDate = new Date(auditEndDate);
          endDate.setDate(endDate.getDate() + 1);
        }
        break;
    }

    return {
      startDate,
      endDate,
      type: auditTypeFilter === "all" ? undefined : auditTypeFilter,
      sku: auditSkuFilter || undefined,
    };
  };

  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Load audit records when filters change
  useEffect(() => {
    if (reportType !== "audit") {
      setAuditRecords([]);
      return;
    }
    
    const loadAuditRecords = async () => {
      setLoadingAudit(true);
      try {
        const records = await getAuditTrail(getAuditFilters());
        setAuditRecords(records);
      } catch (error) {
        console.error('Error loading audit records:', error);
        setAuditRecords([]);
      } finally {
        setLoadingAudit(false);
      }
    };
    
    loadAuditRecords();
  }, [reportType, auditFilter, auditDate, auditStartDate, auditEndDate, auditTypeFilter, auditSkuFilter, getAuditTrail]);

  // Export functions
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

  const exportLocationReport = () => {
    const exportData = locationReport.map(item => ({
      SKU: item.sku,
      'Product Name': item.name,
      ...(selectedLocationId === "all" && { Location: item.locationName }),
      Quantity: item.quantity
    }));
    const locationName = selectedLocationId === "all" ? "All_Locations" : locationList.find(l => l.id === selectedLocationId)?.name || "Unknown";
    exportToCSV(exportData, `Location_Report_${locationName}_${new Date().toISOString().split('T')[0]}`);
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

  const exportAuditReport = () => {
    const exportData = auditRecords.map(record => ({
      'Date & Time': new Date(record.timestampIso).toLocaleString(),
      Type: record.type === "add" ? "Add" : record.type === "deduct" ? "Deduct" : "Transfer",
      SKU: record.sku,
      'Item Name': record.itemName || record.sku,
      Location: record.type === "transfer" ? 
        `${record.fromLocationName} → ${record.toLocationName}` : 
        record.locationName,
      Quantity: record.quantity,
      Note: record.note || ''
    }));
    const filterDesc = auditFilter === "today" ? "Today" : 
                     auditFilter === "week" ? "This_Week" : 
                     auditFilter === "month" ? "This_Month" : 
                     auditFilter === "date" ? auditDate : 
                     auditFilter === "range" ? `${auditStartDate}_to_${auditEndDate}` : "All";
    exportToCSV(exportData, `Audit_Trail_${filterDesc}_${new Date().toISOString().split('T')[0]}`);
  };

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
              <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Reports & Analytics</h1>
              <p className={`text-base md:text-lg ${isDark ? "text-white/90" : "text-gray-700"}`}>Comprehensive insights into your inventory across all locations.</p>
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

      <Card>
        <CardHeader 
          title="Choose What You Want to See" 
          subtitle="Select the type of information you need"
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button
              variant={reportType === "location" ? "primary" : "default"}
              onClick={() => setReportType("location")}
              className="p-6 text-left h-auto"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📍</div>
                <div>
                  <div className="font-semibold text-lg mb-1">Location Report</div>
                  <div className="text-sm opacity-80">See what's in stock at each location</div>
                  <div className="text-xs opacity-60 mt-1">Perfect for checking what you have in each place</div>
                </div>
              </div>
            </Button>
            <Button
              variant={reportType === "product" ? "primary" : "default"}
              onClick={() => setReportType("product")}
              className="p-6 text-left h-auto"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📦</div>
                <div>
                  <div className="font-semibold text-lg mb-1">Product Report</div>
                  <div className="text-sm opacity-80">Track a specific item across all locations</div>
                  <div className="text-xs opacity-60 mt-1">Great for finding where a product is stored</div>
                </div>
              </div>
            </Button>
            <Button
              variant={reportType === "audit" ? "primary" : "default"}
              onClick={() => setReportType("audit")}
              className="p-6 text-left h-auto"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📋</div>
                <div>
                  <div className="font-semibold text-lg mb-1">Activity History</div>
                  <div className="text-sm opacity-80">See all changes and movements</div>
                  <div className="text-xs opacity-60 mt-1">Track what was added, removed, or moved</div>
                </div>
              </div>
            </Button>
          </div>

          {reportType === "location" && (
            <div className={`p-4 rounded-lg border ${
              isDark ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"
            }`}>
              <Label>
                <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2 block`}>
                  📍 Which location do you want to check?
                </span>
                <Select 
                  value={selectedLocationId} 
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="text-base"
                >
                  <option value="">👆 Please choose a location</option>
                  <option value="all">🌍 All Locations (see everything)</option>
                  {locationList.map((loc) => (
                    <option key={loc.id} value={loc.id}>📍 {loc.name}</option>
                  ))}
                </Select>
                <div className={`text-sm mt-2 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                  💡 Tip: Choose "All Locations" to see everything at once
                </div>
              </Label>
            </div>
          )}

          {reportType === "product" && (
            <div className={`p-4 rounded-lg border ${
              isDark ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"
            }`}>
              <Label>
                <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2 block`}>
                  📦 Which product do you want to track?
                </span>
                <Select 
                  value={selectedSku} 
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="text-base"
                >
                  <option value="">👆 Please choose a product</option>
                  {itemList.map((item) => (
                    <option key={item.sku} value={item.sku}>📦 {item.sku} — {item.name}</option>
                  ))}
                </Select>
                <div className={`text-sm mt-2 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                  💡 Tip: This will show you where this product is stored across all locations
                </div>
              </Label>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Location Report Results */}
      {reportType === "location" && selectedLocationId && (
        <Card>
          <CardHeader 
            title={selectedLocationId === "all" ? "Stock in All Locations" : `Stock in ${locationList.find(l => l.id === selectedLocationId)?.name}`}
            subtitle={`${locationReport.length} items with stock`}
          />
          <div className="p-4 md:p-5 border-b border-white/10">
            <Button
              variant="primary"
              onClick={exportLocationReport}
              disabled={locationReport.length === 0}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
          </div>
          <CardBody>
            {locationReport.length === 0 ? (
              <p className={`text-center py-8 text-base ${isDark ? "text-white/60" : "text-gray-500"}`}>No stock found in this location.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                  <thead>
                    <tr className={`text-left border-b ${isDark ? "border-white/20" : "border-gray-200"}`}>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>SKU</th>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Product Name</th>
                      {selectedLocationId === "all" && (
                        <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Location</th>
                      )}
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationReport.map((item, index) => (
                      <tr key={selectedLocationId === "all" ? `${item.sku}-${item.locationName}-${index}` : `${item.sku}-${selectedLocationId}`} className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                        <td className={`p-3 font-mono ${isDark ? "text-white" : "text-gray-900"}`}>{item.sku}</td>
                        <td className={`p-3 ${isDark ? "text-white" : "text-gray-900"}`}>{item.name}</td>
                        {selectedLocationId === "all" && (
                          <td className={`p-3 ${isDark ? "text-white" : "text-gray-900"}`}>{item.locationName}</td>
                        )}
                        <td className="p-3 font-semibold text-[var(--primary)]">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Product Report Results */}
      {reportType === "product" && selectedSku && selectedItem && (
        <Card>
          <CardHeader 
            title={`${selectedItem.sku} — ${selectedItem.name}`}
            subtitle={`Stock across all locations`}
          />
          <div className="p-4 md:p-5 border-b border-white/10">
            <Button
              variant="primary"
              onClick={exportProductReport}
              disabled={productReport.length === 0}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
          </div>
          <CardBody>
            {/* Product Details */}
            <div className={`mb-4 p-3 rounded-lg border ${
              isDark 
                ? "bg-white/5 border-white/20" 
                : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isDark ? "text-white/80" : "text-gray-600"}`}>Selling:</span>
                  <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    €{(selectedItem.sellingPriceEuroCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className={`text-left border-b ${isDark ? "border-white/20" : "border-gray-200"}`}>
                    <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Location</th>
                    <th className={`p-3 font-semibold text-center ${isDark ? "text-white" : "text-gray-900"}`}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {productReport.map((item) => (
                    <tr key={item.locationId} className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                      <td className={`p-3 ${isDark ? "text-white" : "text-gray-900"}`}>{item.locationName}</td>
                      <td className="p-3 font-semibold text-[var(--primary)] text-center">{item.quantity}</td>
                    </tr>
                  ))}
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
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Audit Trail Report */}
      {reportType === "audit" && (
        <Card>
          <CardHeader 
            title="Audit Trail" 
            subtitle="Complete history of all inventory movements and changes"
          />
          <div className="p-4 md:p-5 border-b border-white/10">
            <Button
              variant="primary"
              onClick={exportAuditReport}
              disabled={auditRecords.length === 0}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
          </div>
          <CardBody>
            {/* Audit Filters */}
            <div className={`p-4 rounded-lg border ${
              isDark ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                🔍 Filter the activity history
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    📅 When did it happen?
                  </span>
                  <Select
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value as any)}
                    className="text-base"
                  >
                    <option value="today">📅 Today</option>
                    <option value="week">📆 This Week</option>
                    <option value="month">🗓️ This Month</option>
                    <option value="date">📝 Specific Date</option>
                    <option value="range">📊 Date Range</option>
                  </Select>
                </Label>

                {auditFilter === "date" && (
                  <Label>
                    <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                      📅 Choose the date
                    </span>
                    <Input
                      type="date"
                      value={auditDate}
                      onChange={(e) => setAuditDate(e.target.value)}
                      className="text-base"
                    />
                  </Label>
                )}

                {auditFilter === "range" && (
                  <>
                    <Label>
                      <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        📅 From this date
                      </span>
                      <Input
                        type="date"
                        value={auditStartDate}
                        onChange={(e) => setAuditStartDate(e.target.value)}
                        className="text-base"
                      />
                    </Label>
                    <Label>
                      <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        📅 To this date
                      </span>
                      <Input
                        type="date"
                        value={auditEndDate}
                        onChange={(e) => setAuditEndDate(e.target.value)}
                        className="text-base"
                      />
                    </Label>
                  </>
                )}

                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    🔄 What type of activity?
                  </span>
                  <Select
                    value={auditTypeFilter}
                    onChange={(e) => setAuditTypeFilter(e.target.value as any)}
                    className="text-base"
                  >
                    <option value="all">🔄 All Activities</option>
                    <option value="add">➕ Items Added</option>
                    <option value="deduct">➖ Items Removed</option>
                    <option value="transfer">🚚 Items Moved</option>
                  </Select>
                </Label>

                <Label>
                  <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    📦 Which specific item?
                  </span>
                  <Select
                    value={auditSkuFilter}
                    onChange={(e) => setAuditSkuFilter(e.target.value)}
                    className="text-base"
                  >
                    <option value="">📦 All Items</option>
                    {itemList.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        📦 {item.name} ({item.sku})
                      </option>
                    ))}
                  </Select>
                </Label>
              </div>
              
              <div className={`text-sm mt-4 p-3 rounded-lg ${
                isDark ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                💡 <strong>Tip:</strong> You can combine these filters to find exactly what you're looking for. For example, see all items added today, or all movements of a specific product this week.
              </div>
            </div>

            {/* Audit Records */}
            <div className="overflow-x-auto">
              {loadingAudit ? (
                <div className={`text-center py-8 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                  <p>Loading audit records...</p>
                </div>
              ) : auditRecords.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                  <p>No movements found for the selected criteria.</p>
                </div>
              ) : (
                <table className="min-w-full text-base">
                  <thead>
                    <tr className={`text-left border-b ${isDark ? "border-white/20" : "border-gray-200"}`}>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Date & Time</th>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Type</th>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Item</th>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Location</th>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Quantity</th>
                      <th className={`p-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRecords.map((record) => (
                      <tr key={record.id} className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                        <td className={`p-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                          {new Date(record.timestampIso).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.type === "add" 
                              ? "bg-green-100 text-green-800" 
                              : record.type === "deduct"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {record.type === "add" ? "Add" : record.type === "deduct" ? "Deduct" : "Transfer"}
                          </span>
                        </td>
                        <td className={`p-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                          <div>
                            <div className="font-medium">{record.itemName || record.sku}</div>
                            <div className="text-sm opacity-70">{record.sku}</div>
                          </div>
                        </td>
                        <td className={`p-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                          {record.type === "transfer" ? (
                            <div className="text-sm">
                              {record.fromLocationName} → {record.toLocationName}
                            </div>
                          ) : (
                            <div className="text-sm">
                              {record.locationName}
                            </div>
                          )}
                        </td>
                        <td className={`p-3 font-semibold text-[var(--primary)] ${isDark ? "text-white" : "text-gray-900"}`}>
                          {record.quantity}
                        </td>
                        <td className={`p-3 ${isDark ? "text-white/80" : "text-gray-600"}`}>
                          {record.note || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
