"use client";

import { useMemo, useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { euro } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

export function ItemsManager() {
  const { items, locations, stockByLocation, addItem } = useSupabaseInventoryStore();
  const { theme } = useTheme();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [cost, setCost] = useState("0");
  const [price, setPrice] = useState("0");
  const [quantityKind, setQuantityKind] = useState<"unit" | "kg">("unit");
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");

  const locationList = useMemo(() => Object.values(locations), [locations]);
  const itemList = useMemo(() => Object.values(items), [items]);
  const isDark = theme === "dark";

  return (
    <div className="space-y-6 md:space-y-8">
      <Card>
        <CardHeader title="Add Item" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>SKU</span>
              <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Product Name</span>
              <Input placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Cost (EUR)</span>
              <Input placeholder="Cost (EUR)" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Price (EUR)</span>
              <Input placeholder="Price (EUR)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Label>
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Quantity Kind</span>
              <Select value={quantityKind} onChange={(e) => setQuantityKind(e.target.value as any)}>
                <option value="unit">Unit</option>
                <option value="kg">Kg</option>
              </Select>
            </Label>
            <Button
              variant="primary"
              disabled={isAdding}
              onClick={async () => {
                if (!sku || !name) {
                  setAddMessage("Please enter SKU and Product Name");
                  return;
                }
                
                setIsAdding(true);
                setAddMessage("");
                
                try {
                  const costCents = Math.round(parseFloat(cost) * 100) || 0;
                  const priceCents = Math.round(parseFloat(price) * 100) || 0;
                  await addItem({ sku, name, costPriceEuroCents: costCents, sellingPriceEuroCents: priceCents, quantityKind });
                  
                  setSku("");
                  setName("");
                  setCost("0");
                  setPrice("0");
                  setQuantityKind("unit");
                  setAddMessage("Item added successfully!");
                  
                  // Clear success message after 3 seconds
                  setTimeout(() => setAddMessage(""), 3000);
                } catch (error) {
                  console.error('Error adding item:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
                  const errorDetails = error instanceof Error ? error.toString() : String(error);
                  
                  // Handle specific error types
                  if (errorMessage.includes('timeout')) {
                    setAddMessage('Error: Request timed out. Please check your internet connection and try again.');
                  } else if (errorMessage.includes('Supabase error')) {
                    setAddMessage(`Error: ${errorMessage}`);
                  } else {
                    setAddMessage(`Error: ${errorMessage}`);
                  }
                  
                  console.error('Full error details:', errorDetails);
                } finally {
                  setIsAdding(false);
                }
              }}
            >
              {isAdding ? "Adding..." : "Save"}
            </Button>
          </div>
          
          {addMessage && (
            <div className={`mt-4 p-3 rounded-lg border ${
              addMessage.includes("Error") || addMessage.includes("Please")
                ? isDark 
                  ? "bg-red-500/20 border-red-500/30 text-red-300" 
                  : "bg-red-100 border-red-200 text-red-700"
                : isDark 
                  ? "bg-green-500/20 border-green-500/30 text-green-300" 
                  : "bg-green-100 border-green-200 text-green-700"
            }`}>
              {addMessage}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catalogue" />
        <CardBody>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left whitespace-nowrap">
                  <th className="p-2">SKU</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Cost</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Kind</th>
                  {locationList.map((loc) => (
                    <th key={loc.id} className="p-2">{loc.name}</th>
                  ))}
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {itemList.map((it) => {
                  const perLocation = locationList.map((loc) => stockByLocation[`${it.sku}::${loc.id}`] || 0);
                  const total = perLocation.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={it.sku} className="border-t">
                      <td className="p-2 font-mono">{it.sku}</td>
                      <td className="p-2">{it.name}</td>
                      <td className="p-2">{euro(it.costPriceEuroCents)}</td>
                      <td className="p-2">{euro(it.sellingPriceEuroCents)}</td>
                      <td className="p-2">{it.quantityKind}</td>
                      {perLocation.map((qty, i) => (
                        <td key={i} className="p-2">{qty}</td>
                      ))}
                      <td className="p-2 font-medium">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


