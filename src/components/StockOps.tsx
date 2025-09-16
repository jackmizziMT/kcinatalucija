"use client";

import { useEffect, useMemo, useState } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { AdjustmentReason } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui/Controls";

export function StockOps() {
  const { items, locations, stockByLocation, addStock, deductStock, reasons, addReason } = useInventoryStore();
  const [sku, setSku] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("purchase");
  const [note, setNote] = useState("");
  const [qtyByLoc, setQtyByLoc] = useState<Record<string, number>>({});

  const itemOptions = useMemo(() => Object.values(items), [items]);
  const locationOptions = useMemo(() => Object.values(locations), [locations]);

  useEffect(() => {
    if (!sku && itemOptions.length > 0) setSku(itemOptions[0].sku);
  }, [itemOptions, sku]);

  useEffect(() => {
    // ensure every location has a quantity value (default 1)
    setQtyByLoc((prev) => {
      const next = { ...prev } as Record<string, number>;
      for (const loc of locationOptions) {
        if (!Number.isFinite(next[loc.id])) next[loc.id] = 1;
      }
      return next;
    });
  }, [locationOptions]);

  const getCurrent = (locId: string) => (sku ? stockByLocation[`${sku}::${locId}`] || 0 : 0);
  const setQty = (locId: string, n: number) =>
    setQtyByLoc((m) => ({ ...m, [locId]: Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)) }));

  return (
    <Card>
      <CardHeader title="Stock Operations" />
      <CardBody>
        {itemOptions.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            No items available. Add an item above to enable stock operations.
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end mb-3">
          <Label>
            <span className="text-gray-600">Item</span>
            <Select value={sku} onChange={(e) => setSku(e.target.value)}>
              {itemOptions.map((it) => (
                <option key={it.sku} value={it.sku}>{`${it.sku} - ${it.name}`}</option>
              ))}
            </Select>
          </Label>
          <Label>
            <span className="text-gray-600">Reason</span>
            <div className="flex gap-2 items-center">
              <Input list="reasons" placeholder="Type or pick reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button
                variant="muted"
                onClick={() => {
                  if (reason.trim()) addReason(reason.trim());
                }}
              >
                Save reason
              </Button>
            </div>
            <datalist id="reasons">
              {reasons.map((r) => (
                <option value={r} key={r} />
              ))}
            </datalist>
          </Label>
          <Label>
            <span className="text-gray-600">Note</span>
            <Input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          </Label>
        </div>

        <div className="divide-y rounded-lg border">
          {locationOptions.map((loc) => {
            const qty = Math.max(0, Math.floor(qtyByLoc[loc.id] ?? 1));
            const current = getCurrent(loc.id);
            const canAdjust = Boolean(sku && qty > 0 && items[sku]);
            const insufficient = qty > current;
            return (
              <div key={loc.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{loc.name}</div>
                  <div className="text-xs text-gray-600">Current: {current}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="muted"
                    onClick={() => setQty(loc.id, (qty || 0) + 1)}
                    aria-label={`Increase quantity for ${loc.name}`}
                  >
                    +1
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    className="w-24 text-center"
                    value={qty}
                    onChange={(e) => setQty(loc.id, e.target.value === "" ? 0 : Math.floor(Number(e.target.value)))}
                  />
                  <Button
                    variant="muted"
                    onClick={() => setQty(loc.id, Math.max(0, (qty || 0) - 1))}
                    aria-label={`Decrease quantity for ${loc.name}`}
                  >
                    -1
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    disabled={!canAdjust}
                    onClick={() => addStock(sku, loc.id, qty, reason, note)}
                  >
                    Add
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!canAdjust || insufficient}
                    title={insufficient ? `Insufficient stock (have ${current})` : undefined}
                    onClick={() => deductStock(sku, loc.id, qty, reason, note)}
                  >
                    Deduct
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}


