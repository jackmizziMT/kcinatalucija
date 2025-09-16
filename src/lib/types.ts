export type QuantityKind = "unit" | "kg";

export interface Item {
  sku: string; // globally unique
  name: string;
  costPriceEuroCents: number; // store in cents to avoid float issues
  sellingPriceEuroCents: number; // store in cents
  quantityKind: QuantityKind; // unit or kg (whole numbers only)
}

export interface Location {
  id: string; // stable id
  name: string;
}

export interface StockByLocation {
  // key: `${sku}::${locationId}` -> integer quantity (whole numbers)
  [key: string]: number;
}

// User-editable reason; allow any string
export type AdjustmentReason = string;

export interface StockAdjustment {
  id: string;
  timestampIso: string; // ISO string
  sku: string;
  locationId: string;
  delta: number; // positive add, negative deduct; for set we compute delta relative to previous
  kind: "add" | "deduct" | "set";
  reason: AdjustmentReason;
  note?: string;
  userId?: string;
}

export interface TransferRecord {
  id: string;
  timestampIso: string;
  sku: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number; // whole numbers
  note?: string;
  userId?: string;
}

export interface AuditRecord {
  id: string;
  timestampIso: string;
  type: "add" | "deduct" | "transfer";
  sku: string;
  locationId?: string; // for add/deduct operations
  fromLocationId?: string; // for transfer operations
  toLocationId?: string; // for transfer operations
  quantity: number;
  reason?: string;
  note?: string;
  userId?: string;
  itemName?: string; // cached for display
  locationName?: string; // cached for display
  fromLocationName?: string; // cached for display
  toLocationName?: string; // cached for display
}

export interface User {
  id: string;
  name: string;
  role: "owner" | "editor" | "viewer";
}

export interface InventoryState {
  items: Record<string, Item>; // keyed by sku
  locations: Record<string, Location>; // keyed by id
  stockByLocation: StockByLocation; // key `${sku}::${locationId}` -> qty
  adjustments: StockAdjustment[];
  transfers: TransferRecord[];
  auditTrail: AuditRecord[]; // comprehensive audit trail
  users: Record<string, User>;
  currentUserId?: string;
  reasons: string[]; // editable list of reasons for adjustments
}

export const buildStockKey = (sku: string, locationId: string) => `${sku}::${locationId}`;

export const euro = (cents: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);


