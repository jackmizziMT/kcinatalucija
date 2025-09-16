"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

interface ProductAdjusterProps {
  canEdit?: boolean;
}

export function ProductAdjuster({ canEdit = true }: ProductAdjusterProps) {
  const { items, locations, stockByLocation, addStock, deductStock } = useSupabaseInventoryStore();
  const { theme } = useTheme();
  const [sku, setSku] = useState("");
  const [qtyByLoc, setQtyByLoc] = useState<Record<string, number>>({});
  const [animatingStocks, setAnimatingStocks] = useState<Record<string, 'increase' | 'decrease' | null>>({});
  const previousStockRef = useRef<Record<string, number>>({});
  
  const isDark = theme === "dark";

  const itemList = useMemo(() => Object.values(items), [items]);
  const locationList = useMemo(() => Object.values(locations), [locations]);

  useEffect(() => {
    if (!sku && itemList.length > 0) setSku(itemList[0].sku);
  }, [itemList, sku]);

  useEffect(() => {
    setQtyByLoc((prev) => {
      const next = { ...prev } as Record<string, number>;
      for (const loc of locationList) {
        if (!Number.isFinite(next[loc.id])) next[loc.id] = 1;
      }
      return next;
    });
  }, [locationList]);

  // Track stock changes and trigger animations
  useEffect(() => {
    if (!sku) return;

    locationList.forEach(location => {
      const key = `${sku}::${location.id}`;
      const currentStock = stockByLocation[key] || 0;
      const prevStock = previousStockRef.current[key] || 0;

      if (prevStock !== currentStock && prevStock !== undefined) {
        // Determine animation type
        const animationType = currentStock > prevStock ? 'increase' : 'decrease';
        
        // Set animation state
        setAnimatingStocks(prev => ({ ...prev, [key]: animationType }));
        
        // Clear animation after duration
        setTimeout(() => {
          setAnimatingStocks(prev => ({ ...prev, [key]: null }));
        }, 1000);
      }
    });

    // Update previous stock values in ref
    locationList.forEach(location => {
      const key = `${sku}::${location.id}`;
      previousStockRef.current[key] = stockByLocation[key] || 0;
    });
  }, [stockByLocation, sku, locationList]);

  // Also track quantity input changes for visual feedback
  const previousQtyRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    if (!sku) return;

    locationList.forEach(location => {
      const key = `${sku}::${location.id}`;
      const currentQty = qtyByLoc[location.id] || 1;
      const prevQty = previousQtyRef.current[key] || 1;

      if (prevQty !== currentQty && prevQty !== undefined) {
        // Determine animation type based on quantity change direction
        const animationType = currentQty > prevQty ? 'increase' : 'decrease';
        
        // Trigger a subtle animation for quantity changes
        setAnimatingStocks(prev => ({ ...prev, [key]: animationType }));
        
        // Clear animation after shorter duration for input changes
        setTimeout(() => {
          setAnimatingStocks(prev => ({ ...prev, [key]: null }));
        }, 300);
      }
    });

    // Update previous quantity values in ref
    locationList.forEach(location => {
      const key = `${sku}::${location.id}`;
      previousQtyRef.current[key] = qtyByLoc[location.id] || 1;
    });
  }, [qtyByLoc, sku, locationList]);

  const getCurrent = (locId: string) => (sku ? stockByLocation[`${sku}::${locId}`] || 0 : 0);
  const setQty = (locId: string, n: number) =>
    setQtyByLoc((m) => ({ ...m, [locId]: Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)) }));

  return (
    <Card>
      <CardHeader title="Manage Quantities" />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end mb-4">
          <Label>
            <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Product</span>
            <Select value={sku} onChange={(e) => setSku(e.target.value)}>
              {itemList.length === 0 && <option value="">No items</option>}
              {itemList.map((it) => (
                <option key={it.sku} value={it.sku}>{`${it.sku} — ${it.name}`}</option>
              ))}
            </Select>
          </Label>
        </div>

        <div className={`rounded-lg border divide-y ${
          isDark 
            ? "border-white/20 divide-white/10" 
            : "border-gray-200 divide-gray-200"
        }`}>
          {locationList.map((loc) => {
            const qty = Math.max(0, Math.floor(qtyByLoc[loc.id] ?? 1));
            const current = getCurrent(loc.id);
            const canAdjust = Boolean(sku && qty > 0 && items[sku]);
            const insufficient = qty > current;
            return (
              <div key={loc.id} className={`p-4 transition-colors ${
                isDark 
                  ? "bg-white/5 hover:bg-white/10" 
                  : "bg-gray-50 hover:bg-gray-100"
              }`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{loc.name}</div>
                    <div className={`px-3 py-1 rounded-full text-base font-bold transition-all duration-500 ease-in-out ${
                      isDark 
                        ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30" 
                        : "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                    } ${
                      animatingStocks[`${sku}::${loc.id}`] === 'increase' 
                        ? 'scale-110 bg-green-500/20 text-green-500 border-green-500/30 shadow-lg shadow-green-500/20' 
                        : animatingStocks[`${sku}::${loc.id}`] === 'decrease'
                        ? 'scale-110 bg-red-500/20 text-red-500 border-red-500/30 shadow-lg shadow-red-500/20'
                        : ''
                    }`}>
                      {current} in stock
                    </div>
                  </div>
                  
                  {canEdit ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => addStock(sku, loc.id, 1, "added item", undefined)} 
                          className="px-4 py-3 text-base font-semibold min-w-[60px] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-green-500 hover:bg-green-600 text-white border-green-500 border rounded-lg active:scale-[.99] disabled:cursor-not-allowed"
                        >
                          +1
                        </button>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          className={`w-24 text-center text-base font-medium transition-all duration-300 ${
                            animatingStocks[`${sku}::${loc.id}`] === 'increase' 
                              ? 'ring-2 ring-green-500/50 bg-green-50 dark:bg-green-500/10' 
                              : animatingStocks[`${sku}::${loc.id}`] === 'decrease'
                              ? 'ring-2 ring-red-500/50 bg-red-50 dark:bg-red-500/10'
                              : ''
                          }`}
                          value={qty}
                          onChange={(e) => setQty(loc.id, e.target.value === "" ? 0 : Math.floor(Number(e.target.value)))}
                        />
                        <button 
                          onClick={() => {
                            const currentStock = getCurrent(loc.id);
                            if (currentStock > 0) {
                              deductStock(sku, loc.id, 1, "deducted item", undefined);
                            }
                          }} 
                          className="px-4 py-3 text-base font-semibold min-w-[60px] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-red-500 hover:bg-red-600 text-white border-red-500 border rounded-lg active:scale-[.99] disabled:cursor-not-allowed"
                        >
                          -1
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="muted" 
                          disabled={!canAdjust} 
                          onClick={() => addStock(sku, loc.id, qty, "added item", undefined)}
                          className="flex-1 sm:flex-none px-3 py-2 text-sm border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        >
                          Add
                        </Button>
                        <Button
                          variant="muted"
                          disabled={!canAdjust || insufficient}
                          title={insufficient ? `Insufficient stock (have ${current})` : undefined}
                          onClick={() => deductStock(sku, loc.id, qty, "deducted item", undefined)}
                          className="flex-1 sm:flex-none px-3 py-2 text-sm border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          Deduct
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-4 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                      <p className="text-sm">View-only mode - No editing allowed</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}


