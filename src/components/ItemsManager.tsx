"use client";

import { useMemo, useState } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { euro } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

export function ItemsManager() {
  const { items, locations, stockByLocation, addItem } = useInventoryStore();
  const { theme } = useTheme();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [cost, setCost] = useState("0");
  const [price, setPrice] = useState("0");
  const [quantityKind, setQuantityKind] = useState<"unit" | "kg">("unit");

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
              onClick={() => {
                if (!sku || !name) return;
                const costCents = Math.round(parseFloat(cost) * 100) || 0;
                const priceCents = Math.round(parseFloat(price) * 100) || 0;
                addItem({ sku, name, costPriceEuroCents: costCents, sellingPriceEuroCents: priceCents, quantityKind });
                setSku("");
                setName("");
                setCost("0");
                setPrice("0");
                setQuantityKind("unit");
              }}
            >
              Save
            </Button>
          </div>
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


