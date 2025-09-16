"use client";

import { useMemo, useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";
import { euro } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";
import { useTheme } from "@/contexts/ThemeContext";

export function ItemsManager() {
  const { items, locations, stockByLocation, addItem, updateItem, removeItem, checkSkuExists } = useSupabaseInventoryStore();
  const { theme } = useTheme();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [quantityKind, setQuantityKind] = useState<"unit" | "kg">("unit");
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [skuExists, setSkuExists] = useState(false);
  const [isCheckingSku, setIsCheckingSku] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const locationList = useMemo(() => Object.values(locations), [locations]);
  const itemList = useMemo(() => Object.values(items), [items]);
  const isDark = theme === "dark";

  // Check if SKU exists when user types
  const handleSkuChange = async (value: string) => {
    setSku(value);
    setSkuExists(false);
    
    if (value.trim().length > 0) {
      setIsCheckingSku(true);
      try {
        const exists = await checkSkuExists(value.trim());
        setSkuExists(exists);
      } catch (error) {
        console.error('Error checking SKU:', error);
      } finally {
        setIsCheckingSku(false);
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <Card>
        <CardHeader title="Add Item" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>SKU</span>
                <div className="relative">
                  <Input 
                    placeholder="SKU" 
                    value={sku} 
                    onChange={(e) => handleSkuChange(e.target.value)}
                    className={skuExists ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {isCheckingSku && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {sku.trim().length > 0 && !isCheckingSku && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {skuExists ? (
                        <span className="text-red-500 text-xs">⚠️</span>
                      ) : (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </div>
                  )}
                </div>
              </Label>
              {skuExists && (
                <p className="text-red-500 text-sm">
                  SKU "{sku}" already exists. Please use a different SKU.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Product Name</span>
                <Input 
                  placeholder="Product Name (supports Maltese: ĦħĠġŻż)" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </Label>
            </div>
            
            <Label>
              <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Price (EUR)</span>
              <Input placeholder="Price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Label>
            
            <div className="grid grid-cols-2 gap-2">
              <Label>
                <span className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Quantity Kind</span>
                <Select value={quantityKind} onChange={(e) => setQuantityKind(e.target.value as any)}>
                  <option value="unit">Unit</option>
                  <option value="kg">Kg</option>
                </Select>
              </Label>
              <Button
                variant="primary"
                disabled={isAdding || skuExists}
                onClick={async () => {
                  if (!sku || !name) {
                    setAddMessage("Please enter SKU and Product Name");
                    return;
                  }
                  
                  if (skuExists) {
                    setAddMessage(`SKU "${sku}" already exists. Please use a different SKU.`);
                    return;
                  }
                  
                  setIsAdding(true);
                  setAddMessage("");
                  
                  try {
                    const priceCents = Math.round(parseFloat(price) * 100) || 0;
                    await addItem({ sku, name, sellingPriceEuroCents: priceCents, quantityKind });
                    
                    setSku("");
                    setName("");
                    setPrice("0");
                    setQuantityKind("unit");
                    setSkuExists(false);
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
                  <th className="p-2">Price</th>
                  <th className="p-2">Kind</th>
                  {locationList.map((loc) => (
                    <th key={loc.id} className="p-2">{loc.name}</th>
                  ))}
                  <th className="p-2">Total</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemList.map((it) => {
                  const perLocation = locationList.map((loc) => stockByLocation[`${it.sku}::${loc.id}`] || 0);
                  const total = perLocation.reduce((a, b) => a + b, 0);
                  const isEditing = editingSku === it.sku;
                  
                  return (
                    <tr key={it.sku} className="border-t">
                      <td className="p-2 font-mono">{it.sku}</td>
                      <td className="p-2">
                        {isEditing ? (
                          <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="text-xs h-8"
                          />
                        ) : (
                          it.name
                        )}
                      </td>
                      <td className="p-2">
                        {isEditing ? (
                          <Input 
                            type="number" 
                            step="0.01"
                            value={price} 
                            onChange={(e) => setPrice(e.target.value)}
                            className="text-xs h-8"
                          />
                        ) : (
                          euro(it.sellingPriceEuroCents)
                        )}
                      </td>
                      <td className="p-2">
                        {isEditing ? (
                          <Select 
                            value={quantityKind} 
                            onChange={(e) => setQuantityKind(e.target.value as any)}
                            className="text-xs h-8"
                          >
                            <option value="unit">Unit</option>
                            <option value="kg">Kg</option>
                          </Select>
                        ) : (
                          it.quantityKind
                        )}
                      </td>
                      {perLocation.map((qty, i) => (
                        <td key={i} className="p-2">{qty}</td>
                      ))}
                      <td className="p-2 font-medium">{total}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="primary"
                                className="text-xs px-2 py-1 h-6"
                                disabled={isUpdating}
                                onClick={async () => {
                                  setIsUpdating(true);
                                  try {
                                    const priceCents = Math.round(parseFloat(price) * 100) || 0;
                                    await updateItem(it.sku, {
                                      name,
                                      sellingPriceEuroCents: priceCents,
                                      quantityKind
                                    });
                                    setEditingSku(null);
                                    setAddMessage("Item updated successfully!");
                                    setTimeout(() => setAddMessage(""), 3000);
                                  } catch (error) {
                                    console.error('Error updating item:', error);
                                    setAddMessage(`Error updating item: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                    setTimeout(() => setAddMessage(""), 5000);
                                  } finally {
                                    setIsUpdating(false);
                                  }
                                }}
                              >
                                {isUpdating ? "..." : "Save"}
                              </Button>
                              <Button
                                variant="default"
                                className="text-xs px-2 py-1 h-6"
                                onClick={() => {
                                  setEditingSku(null);
                                  setName("");
                                  setPrice("0");
                                  setQuantityKind("unit");
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="default"
                                className="text-xs px-2 py-1 h-6"
                                onClick={() => {
                                  setEditingSku(it.sku);
                                  setName(it.name);
                                  setPrice((it.sellingPriceEuroCents / 100).toFixed(2));
                                  setQuantityKind(it.quantityKind);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                className="text-xs px-2 py-1 h-6"
                                disabled={isDeleting === it.sku}
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete "${it.name}" (${it.sku})? This will also remove all stock records.`)) {
                                    setIsDeleting(it.sku);
                                    try {
                                      await removeItem(it.sku);
                                      setAddMessage("Item deleted successfully!");
                                      setTimeout(() => setAddMessage(""), 3000);
                                    } catch (error) {
                                      console.error('Error deleting item:', error);
                                      setAddMessage(`Error deleting item: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                      setTimeout(() => setAddMessage(""), 5000);
                                    } finally {
                                      setIsDeleting(null);
                                    }
                                  }
                                }}
                              >
                                {isDeleting === it.sku ? "..." : "Delete"}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
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


