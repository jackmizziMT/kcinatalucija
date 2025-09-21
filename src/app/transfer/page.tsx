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
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");

  const itemList = useMemo(() => Object.values(items), [items]);
  const locationList = useMemo(() => Object.values(locations), [locations]);

  // Remove auto-selection to prevent accidental transfers
  // useEffect(() => {
  //   if (!sku && itemList.length > 0) setSku(itemList[0].sku);
  // }, [itemList, sku]);

  // useEffect(() => {
  //   if (!fromLocationId && locationList.length > 0) setFromLocationId(locationList[0].id);
  //   if (!toLocationId && locationList.length > 1) setToLocationId(locationList[1].id);
  // }, [locationList, fromLocationId, toLocationId]);

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
              <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>🚚 Stock Transfer</h1>
              <p className={`text-base md:text-lg ${isDark ? "text-white/90" : "text-gray-700"}`}>Move inventory between locations with full tracking and audit trail.</p>
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
          title="Move Stock Between Locations" 
          subtitle="Select what you want to transfer and where it should go"
        />
        <CardBody>
          {/* Product Selection */}
          <div className="mb-6">
            <Label>
              <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2 block`}>
                📦 Which product do you want to transfer?
              </span>
              <Select value={sku} onChange={(e) => setSku(e.target.value)} className="text-base">
                <option value="">👆 Select a product to transfer</option>
                {itemList.length === 0 && <option value="">No items available</option>}
                {itemList.map((it) => (
                  <option key={it.sku} value={it.sku}>{`${it.sku} — ${it.name}`}</option>
                ))}
              </Select>
              <div className={`text-sm mt-2 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                💡 Choose the product you want to move between locations
              </div>
            </Label>
          </div>

          {/* Show transfer form only when product is selected */}
          {sku ? (
            <>
              {/* Quantity Selection */}
              <div className="mb-6">
                <Label>
                  <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2 block`}>
                    🔢 How many items to transfer?
                  </span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={Number.isFinite(quantity) ? quantity : 1}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Math.floor(Number(e.target.value));
                      setQuantity(Number.isFinite(val) ? Math.max(0, val) : 0);
                    }}
                    className="text-base"
                    placeholder="Enter quantity"
                  />
                  <div className={`text-sm mt-2 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                    💡 Enter the number of items you want to move
                  </div>
                </Label>
              </div>

              {/* Location Selection */}
              <div className={`p-4 rounded-lg border ${
                isDark ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"
              } mb-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  📍 Choose locations for transfer
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Label>
                    <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                      🚚 From Location
                    </span>
                    <Select value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)} className="text-base">
                      <option value="">👆 Select source location</option>
                      {locationList.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({getCurrentStock(loc.id)} in stock)
                        </option>
                      ))}
                    </Select>
                  </Label>
                  
                  <Label>
                    <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                      🎯 To Location
                    </span>
                    <Select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} className="text-base">
                      <option value="">👆 Select destination location</option>
                      {locationList.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({getCurrentStock(loc.id)} in stock)
                        </option>
                      ))}
                    </Select>
                  </Label>
                </div>
              </div>

              {/* Optional Note */}
              <div className="mb-6">
                <Label>
                  <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2 block`}>
                    📝 Transfer Note (Optional)
                  </span>
                  <Input 
                    placeholder="e.g., Moving to front display, restocking shelf, etc." 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)}
                    className="text-base"
                  />
                  <div className={`text-sm mt-2 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                    💡 Add a note to explain why you're moving this stock
                  </div>
                </Label>
              </div>
            </>
          ) : (
            /* Show prompt when no product is selected */
            <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
              isDark 
                ? "border-white/20 bg-white/5" 
                : "border-gray-300 bg-gray-50"
            }`}>
              <div className="text-4xl mb-4">🚚</div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                Select a Product to Start Transfer
              </h3>
              <p className={`text-base ${isDark ? "text-white/70" : "text-gray-600"}`}>
                Choose a product from the dropdown above to begin transferring stock between locations.
              </p>
              <div className={`mt-4 text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
                💡 This prevents accidental transfers when navigating to the transfer page
              </div>
            </div>
          )}

          {/* Transfer Button and Error Handling - only show when product is selected */}
          {sku && (
            <>
              {parsedQty > fromStock && (
                <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="text-base font-semibold text-red-300">Insufficient Stock</p>
                      <p className="text-sm text-red-300">
                        Available: {fromStock} items, Requested: {parsedQty} items
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  disabled={!canTransfer || isTransferring}
                  onClick={async () => {
                    setIsTransferring(true);
                    setTransferMessage("");
                    
                    try {
                      const fromLocation = locationList.find(loc => loc.id === fromLocationId);
                      const toLocation = locationList.find(loc => loc.id === toLocationId);
                      const item = itemList.find(item => item.sku === sku);
                      
                      await transferStock(sku, fromLocationId, toLocationId, parsedQty, note);
                      
                      setTransferMessage(`✅ Successfully transferred ${parsedQty} units of ${item?.name} from ${fromLocation?.name} to ${toLocation?.name}`);
                      
                      // Clear form after successful transfer
                      setQuantity(1);
                      setNote("");
                      
                      // Clear success message after 5 seconds
                      setTimeout(() => setTransferMessage(""), 5000);
                      
                    } catch (error) {
                      console.error('Transfer error:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
                      setTransferMessage(`❌ Error: ${errorMessage}`);
                      
                      // Clear error message after 5 seconds
                      setTimeout(() => setTransferMessage(""), 5000);
                    } finally {
                      setIsTransferring(false);
                    }
                  }}
                  className="px-8 py-4 text-lg font-semibold"
                >
                  {isTransferring ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Transferring...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🚚</span>
                      Transfer Stock
                    </div>
                  )}
                </Button>
              </div>
            </>
          )}
          
          {transferMessage && (
            <div className={`mt-6 p-4 rounded-lg border ${
              transferMessage.includes("✅")
                ? isDark 
                  ? "bg-green-500/20 border-green-500/30 text-green-300" 
                  : "bg-green-100 border-green-200 text-green-700"
                : isDark 
                  ? "bg-red-500/20 border-red-500/30 text-red-300" 
                  : "bg-red-100 border-red-200 text-red-700"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {transferMessage.includes("✅") ? "✅" : "❌"}
                </span>
                <span className="font-medium">{transferMessage}</span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
