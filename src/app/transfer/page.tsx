"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function TransferPage() {
  return (
    <AuthGuard requireEditor={true}>
      <TransferContent />
    </AuthGuard>
  );
}

function TransferContent() {
  const { items, locations, stockByLocation, transferStock } = useSupabaseInventoryStore();
  const { theme } = useTheme();
  const [sku, setSku] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState("");

  const itemList = useMemo(() => Object.values(items), [items]);
  const locationList = useMemo(() => Object.values(locations), [locations]);

  useEffect(() => {
    if (!sku && itemList.length > 0) setSku(itemList[0].sku);
  }, [itemList, sku]);

  useEffect(() => {
    if (!fromLocationId && locationList.length > 0) setFromLocationId(locationList[0].id);
    if (!toLocationId && locationList.length > 1) setToLocationId(locationList[1].id);
  }, [locationList, fromLocationId, toLocationId]);

  const getCurrentStock = (locId: string) => (sku ? stockByLocation[`${sku}::${locId}`] || 0 : 0);
  const parsedQty = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
  const fromStock = getCurrentStock(fromLocationId);
  const canTransfer = Boolean(sku && fromLocationId && toLocationId && toLocationId !== fromLocationId && parsedQty > 0 && parsedQty <= fromStock);
  const isDark = theme === "dark";

  return (
    <main className="space-y-6 md:space-y-8">
      <div className={`relative overflow-hidden rounded-xl border p-4 md:p-5 backdrop-blur-sm ${
        isDark 
          ? "border-white/20 bg-gradient-to-r from-white/5 to-white/10" 
          : "border-gray-200 bg-gradient-to-r from-gray-50 to-white"
      }`}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--primary2)]/20 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[var(--primary)]/20 rounded-full translate-y-8 -translate-x-8"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Stock Transfer</h1>
              <p className={`text-base md:text-lg ${isDark ? "text-white/90" : "text-gray-700"}`}>Move inventory between locations with full tracking.</p>
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
        <CardHeader title="Transfer Stock" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Product</span>
              <Select value={sku} onChange={(e) => setSku(e.target.value)}>
                {itemList.length === 0 && <option value="">No items</option>}
                {itemList.map((it) => (
                  <option key={it.sku} value={it.sku}>{`${it.sku} — ${it.name}`}</option>
                ))}
              </Select>
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Quantity</span>
              <Input
                type="number"
                min={1}
                step={1}
                value={Number.isFinite(quantity) ? quantity : 1}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : Math.floor(Number(e.target.value));
                  setQuantity(Number.isFinite(val) ? Math.max(0, val) : 0);
                }}
              />
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>From Location</span>
              <Select value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)}>
                {locationList.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} (Stock: {getCurrentStock(loc.id)})</option>
                ))}
              </Select>
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>To Location</span>
              <Select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)}>
                {locationList.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} (Stock: {getCurrentStock(loc.id)})</option>
                ))}
              </Select>
            </Label>
          </div>

          <Label className="mb-4">
            <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Note (Optional)</span>
            <Input placeholder="Transfer note" value={note} onChange={(e) => setNote(e.target.value)} />
          </Label>

          {parsedQty > fromStock && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
              <p className="text-base text-red-300">
                Insufficient stock. Available: {fromStock}, Requested: {parsedQty}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            disabled={!canTransfer}
            onClick={() => transferStock(sku, fromLocationId, toLocationId, parsedQty, note)}
            className="w-full md:w-auto"
          >
            Transfer Stock
          </Button>
        </CardBody>
      </Card>
    </main>
  );
}
