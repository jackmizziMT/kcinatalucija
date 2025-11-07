"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AdjustmentReason,
  AuditRecord,
  InventoryState,
  Item,
  Location,
  TransferRecord,
  User,
  buildStockKey,
} from "@/lib/types";

type AddItemInput = Omit<Item, "sku"> & { sku: string };

interface InventoryActions {
  addItem: (item: AddItemInput) => void;
  updateItem: (sku: string, updates: Partial<Omit<Item, "sku">>) => void;
  removeItem: (sku: string) => void;

  addLocation: (name: string) => string;
  updateLocation: (id: string, name: string) => void;
  removeLocation: (id: string) => void;

  addStock: (sku: string, locationId: string, quantity: number, reason: AdjustmentReason, note?: string) => void;
  deductStock: (sku: string, locationId: string, quantity: number, reason: AdjustmentReason, note?: string) => void;
  setStock: (sku: string, locationId: string, newQuantity: number, reason: AdjustmentReason, note?: string) => void;
  transferStock: (sku: string, fromLocationId: string, toLocationId: string, quantity: number, note?: string) => void;

  importItems: (items: Item[]) => void;
  exportState: () => string; // JSON string export

  setCurrentUser: (userId?: string) => void;
  addUser: (user: Omit<User, "id">) => string;
  removeUser: (userId: string) => void;
  addReason: (reason: string) => void;
  removeReason: (reason: string) => void;
  getAuditTrail: (filters?: { startDate?: Date; endDate?: Date; type?: string; sku?: string }) => AuditRecord[];
}

export type InventoryStore = InventoryState & InventoryActions;

const generateId = () => Math.random().toString(36).slice(2, 10);
const isoNow = () => new Date().toISOString();

const initialState = (): InventoryState => {
  const a: Location = { id: generateId(), name: "A" };
  const b: Location = { id: generateId(), name: "B" };
  const c: Location = { id: generateId(), name: "C" };
  const d: Location = { id: generateId(), name: "D" };
  const owner: User = { id: generateId(), name: "Owner", role: "owner" };
  return {
    items: {},
    locations: { [a.id]: a, [b.id]: b, [c.id]: c, [d.id]: d },
    stockByLocation: {},
    adjustments: [],
    transfers: [],
    auditTrail: [],
    users: { [owner.id]: owner },
    currentUserId: owner.id,
    reasons: ["purchase", "sale", "correction", "wastage", "return_in", "return_out", "stocktake", "other"],
    bookings: {},
  };
};

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      addItem: (item) =>
        set((state) => {
          if (state.items[item.sku]) return state;
          return { items: { ...state.items, [item.sku]: { ...item } } } as Partial<InventoryState> as InventoryStore;
        }),

      updateItem: (sku, updates) =>
        set((state) => {
          const existing = state.items[sku];
          if (!existing) return state;
          return { items: { ...state.items, [sku]: { ...existing, ...updates } } } as Partial<InventoryState> as InventoryStore;
        }),

      removeItem: (sku) =>
        set((state) => {
          if (!state.items[sku]) return state;
          const items = { ...state.items };
          delete items[sku];
          // remove stock entries and logs for this sku
          const stockByLocation = Object.fromEntries(
            Object.entries(state.stockByLocation).filter(([key]) => !key.startsWith(`${sku}::`))
          );
          const adjustments = state.adjustments.filter((a) => a.sku !== sku);
          const transfers = state.transfers.filter((t) => t.sku !== sku);
          return { items, stockByLocation, adjustments, transfers } as Partial<InventoryState> as InventoryStore;
        }),

      addLocation: (name) => {
        const id = generateId();
        set((state) => ({ locations: { ...state.locations, [id]: { id, name } } } as Partial<InventoryState> as InventoryStore));
        return id;
      },

      updateLocation: (id, name) =>
        set((state) => {
          const loc = state.locations[id];
          if (!loc) return state;
          return { locations: { ...state.locations, [id]: { ...loc, name } } } as Partial<InventoryState> as InventoryStore;
        }),

      removeLocation: (id) =>
        set((state) => {
          if (!state.locations[id]) return state;
          const locations = { ...state.locations };
          delete locations[id];
          const stockByLocation = Object.fromEntries(
            Object.entries(state.stockByLocation).filter(([key]) => !key.endsWith(`::${id}`))
          );
          const adjustments = state.adjustments.filter((a) => a.locationId !== id);
          const transfers = state.transfers.filter((t) => t.fromLocationId !== id && t.toLocationId !== id);
          return { locations, stockByLocation, adjustments, transfers } as Partial<InventoryState> as InventoryStore;
        }),

      addStock: (sku, locationId, quantity, reason, note) => {
        if (quantity <= 0 || !Number.isInteger(quantity)) return;
        const userId = get().currentUserId;
        const timestamp = isoNow();
        set((state) => {
          const key = buildStockKey(sku, locationId);
          const current = state.stockByLocation[key] || 0;
          const next = current + quantity;
          const item = state.items[sku];
          const location = state.locations[locationId];
          
          const auditRecord: AuditRecord = {
            id: generateId(),
            timestampIso: timestamp,
            type: "add",
            sku,
            locationId,
            quantity,
            reason,
            note,
            userId,
            itemName: item?.name,
            locationName: location?.name,
          };

          return {
            stockByLocation: { ...state.stockByLocation, [key]: next },
            adjustments: [
              ...state.adjustments,
              {
                id: generateId(),
                timestampIso: timestamp,
                sku,
                locationId,
                delta: quantity,
                kind: "add",
                reason,
                note,
                userId,
              },
            ],
            auditTrail: [...state.auditTrail, auditRecord],
          } as Partial<InventoryState> as InventoryStore;
        });
      },

      deductStock: (sku, locationId, quantity, reason, note) => {
        if (quantity <= 0 || !Number.isInteger(quantity)) return;
        const userId = get().currentUserId;
        const timestamp = isoNow();
        set((state) => {
          const key = buildStockKey(sku, locationId);
          const current = state.stockByLocation[key] || 0;
          if (quantity > current) {
            // do not allow negative stock
            return state;
          }
          const next = current - quantity;
          const item = state.items[sku];
          const location = state.locations[locationId];
          
          const auditRecord: AuditRecord = {
            id: generateId(),
            timestampIso: timestamp,
            type: "deduct",
            sku,
            locationId,
            quantity,
            reason,
            note,
            userId,
            itemName: item?.name,
            locationName: location?.name,
          };

          return {
            stockByLocation: { ...state.stockByLocation, [key]: next },
            adjustments: [
              ...state.adjustments,
              {
                id: generateId(),
                timestampIso: timestamp,
                sku,
                locationId,
                delta: -quantity,
                kind: "deduct",
                reason,
                note,
                userId,
              },
            ],
            auditTrail: [...state.auditTrail, auditRecord],
          } as Partial<InventoryState> as InventoryStore;
        });
      },

      setStock: (sku, locationId, newQuantity, reason, note) => {
        if (newQuantity < 0 || !Number.isInteger(newQuantity)) return;
        const userId = get().currentUserId;
        set((state) => {
          const key = buildStockKey(sku, locationId);
          const current = state.stockByLocation[key] || 0;
          const delta = newQuantity - current;
          return {
            stockByLocation: { ...state.stockByLocation, [key]: newQuantity },
            adjustments: [
              ...state.adjustments,
              {
                id: generateId(),
                timestampIso: isoNow(),
                sku,
                locationId,
                delta,
                kind: "set",
                reason,
                note,
                userId,
              },
            ],
          } as Partial<InventoryState> as InventoryStore;
        });
      },

      transferStock: (sku, fromLocationId, toLocationId, quantity, note) => {
        if (quantity <= 0 || !Number.isInteger(quantity)) return;
        const userId = get().currentUserId;
        const timestamp = isoNow();
        set((state) => {
          const fromKey = buildStockKey(sku, fromLocationId);
          const toKey = buildStockKey(sku, toLocationId);
          const fromCurrent = state.stockByLocation[fromKey] || 0;
          const toCurrent = state.stockByLocation[toKey] || 0;
          if (quantity > fromCurrent) {
            // do not allow negative stock on source location
            return state;
          }
          const nextFrom = fromCurrent - quantity;
          const nextTo = toCurrent + quantity;
          const item = state.items[sku];
          const fromLocation = state.locations[fromLocationId];
          const toLocation = state.locations[toLocationId];
          
          const auditRecord: AuditRecord = {
            id: generateId(),
            timestampIso: timestamp,
            type: "transfer",
            sku,
            fromLocationId,
            toLocationId,
            quantity,
            note,
            userId,
            itemName: item?.name,
            fromLocationName: fromLocation?.name,
            toLocationName: toLocation?.name,
          };

          return {
            stockByLocation: { ...state.stockByLocation, [fromKey]: nextFrom, [toKey]: nextTo },
            transfers: [
              ...state.transfers,
              {
                id: generateId(),
                timestampIso: timestamp,
                sku,
                fromLocationId,
                toLocationId,
                quantity,
                note,
                userId,
              },
            ],
            auditTrail: [...state.auditTrail, auditRecord],
          } as Partial<InventoryState> as InventoryStore;
        });
      },

      importItems: (items) =>
        set((state) => {
          const next = { ...state.items };
          for (const it of items) {
            next[it.sku] = it;
          }
          return { items: next } as Partial<InventoryState> as InventoryStore;
        }),

      exportState: () => JSON.stringify(get(), null, 2),

      setCurrentUser: (userId) => set(() => ({ currentUserId: userId } as Partial<InventoryState> as InventoryStore)),

      addUser: (user) => {
        const id = generateId();
        set((state) => ({ users: { ...state.users, [id]: { id, ...user } } } as Partial<InventoryState> as InventoryStore));
        return id;
      },

      removeUser: (userId) =>
        set((state) => {
          const next = { ...state.users };
          delete next[userId];
          const currentUserId = state.currentUserId === userId ? undefined : state.currentUserId;
          return { users: next, currentUserId } as Partial<InventoryState> as InventoryStore;
        }),

      addReason: (reason) =>
        set((state) => {
          const r = reason.trim();
          if (!r) return state;
          if (state.reasons.includes(r)) return state;
          return { reasons: [...state.reasons, r] } as Partial<InventoryState> as InventoryStore;
        }),

      removeReason: (reason) =>
        set((state) => ({ reasons: state.reasons.filter((r) => r !== reason) } as Partial<InventoryState> as InventoryStore)),

      getAuditTrail: (filters) => {
        const state = get();
        let auditRecords = [...state.auditTrail];

        // Sort by timestamp (newest first)
        auditRecords.sort((a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime());

        // Apply filters
        if (filters) {
          if (filters.startDate) {
            auditRecords = auditRecords.filter(record => 
              new Date(record.timestampIso) >= filters.startDate!
            );
          }
          if (filters.endDate) {
            auditRecords = auditRecords.filter(record => 
              new Date(record.timestampIso) <= filters.endDate!
            );
          }
          if (filters.type) {
            auditRecords = auditRecords.filter(record => record.type === filters.type);
          }
          if (filters.sku) {
            auditRecords = auditRecords.filter(record => record.sku === filters.sku);
          }
        }

        return auditRecords;
      },
    }),
    {
      name: "inventory-tracker-store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as unknown as Storage))),
      partialize: (state) => state,
      version: 1,
    }
  )
);


