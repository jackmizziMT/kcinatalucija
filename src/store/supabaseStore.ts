"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  AdjustmentReason,
  AuditRecord,
  InventoryState,
  Item,
  Location,
  buildStockKey,
} from "@/lib/types";

type AddItemInput = Omit<Item, "sku"> & { sku: string };

interface InventoryActions {
  // Items
  addItem: (item: AddItemInput) => Promise<void>;
  updateItem: (sku: string, updates: Partial<Omit<Item, "sku">>) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  importItems: (items: Item[]) => Promise<void>;

  // Locations
  addLocation: (location: Omit<Location, "id">) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Omit<Location, "id">>) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;

  // Stock operations
  addStock: (sku: string, locationId: string, quantity: number, reason?: string, note?: string) => Promise<void>;
  deductStock: (sku: string, locationId: string, quantity: number, reason?: string, note?: string) => Promise<void>;
  transferStock: (sku: string, fromLocationId: string, toLocationId: string, quantity: number, note?: string) => Promise<void>;

  // Audit trail
  getAuditTrail: (filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: "add" | "deduct" | "transfer";
    sku?: string;
  }) => Promise<AuditRecord[]>;

  // Export
  exportState: () => InventoryState;

  // Sync
  syncFromDatabase: () => Promise<void>;
}

export type SupabaseInventoryStore = InventoryState & InventoryActions;

const generateId = () => Math.random().toString(36).slice(2, 10);
const isoNow = () => new Date().toISOString();

export const useSupabaseInventoryStore = create<SupabaseInventoryStore>()((set, get) => ({
  // Initial state
  items: {},
  locations: {},
  stockByLocation: {},
  adjustments: [],
  transfers: [],
  auditTrail: [],
  users: {},
  currentUserId: undefined,
  reasons: ["purchase", "sale", "correction", "wastage", "return_in", "return_out", "stocktake", "other"],

  // Items
  addItem: async (item) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          sku: item.sku,
          name: item.name,
          cost_price_euro_cents: item.costPriceEuroCents,
          selling_price_euro_cents: item.sellingPriceEuroCents,
          quantity_kind: item.quantityKind,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        items: { ...state.items, [item.sku]: item }
      }));
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  },

  updateItem: async (sku, updates) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({
          name: updates.name,
          cost_price_euro_cents: updates.costPriceEuroCents,
          selling_price_euro_cents: updates.sellingPriceEuroCents,
          quantity_kind: updates.quantityKind,
        })
        .eq('sku', sku);

      if (error) throw error;

      set((state) => {
        const existing = state.items[sku];
        if (!existing) return state;
        return {
          items: { ...state.items, [sku]: { ...existing, ...updates } }
        };
      });
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  removeItem: async (sku) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('sku', sku);

      if (error) throw error;

      set((state) => {
        if (!state.items[sku]) return state;
        const items = { ...state.items };
        delete items[sku];
        
        // Remove stock entries for this SKU
        const stockByLocation = Object.fromEntries(
          Object.entries(state.stockByLocation).filter(([key]) => !key.startsWith(`${sku}::`))
        );

        return { items, stockByLocation };
      });
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  },

  importItems: async (items) => {
    try {
      const itemsToInsert = items.map(item => ({
        sku: item.sku,
        name: item.name,
        cost_price_euro_cents: item.costPriceEuroCents,
        selling_price_euro_cents: item.sellingPriceEuroCents,
        quantity_kind: item.quantityKind,
      }));

      const { error } = await supabase
        .from('items')
        .upsert(itemsToInsert, { onConflict: 'sku' });

      if (error) throw error;

      // Update local state
      const itemsMap = items.reduce((acc, item) => {
        acc[item.sku] = item;
        return acc;
      }, {} as Record<string, Item>);

      set((state) => ({
        items: { ...state.items, ...itemsMap }
      }));
    } catch (error) {
      console.error('Error importing items:', error);
      throw error;
    }
  },

  // Locations
  addLocation: async (location) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({ name: location.name })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        locations: { ...state.locations, [data.id]: { id: data.id, name: data.name } }
      }));
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  },

  updateLocation: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ name: updates.name })
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const existing = state.locations[id];
        if (!existing) return state;
        return {
          locations: { ...state.locations, [id]: { ...existing, ...updates } }
        };
      });
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  removeLocation: async (id) => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        if (!state.locations[id]) return state;
        const locations = { ...state.locations };
        delete locations[id];

        // Remove stock entries for this location
        const stockByLocation = Object.fromEntries(
          Object.entries(state.stockByLocation).filter(([key]) => !key.endsWith(`::${id}`))
        );

        return { locations, stockByLocation };
      });
    } catch (error) {
      console.error('Error removing location:', error);
      throw error;
    }
  },

  // Stock operations
  addStock: async (sku, locationId, quantity, reason, note) => {
    if (quantity <= 0 || !Number.isInteger(quantity)) return;

    try {
      // Get current stock
      const { data: currentStock, error: stockError } = await supabase
        .from('stock_by_location')
        .select('quantity')
        .eq('sku', sku)
        .eq('location_id', locationId)
        .single();

      const currentQuantity = currentStock?.quantity || 0;
      const newQuantity = currentQuantity + quantity;

      // Update or insert stock
      const { error: upsertError } = await supabase
        .from('stock_by_location')
        .upsert({
          sku,
          location_id: locationId,
          quantity: newQuantity,
        }, { onConflict: 'sku,location_id' });

      if (upsertError) throw upsertError;

      // Add audit record
      const { data: itemData } = await supabase
        .from('items')
        .select('name')
        .eq('sku', sku)
        .single();

      const { data: locationData } = await supabase
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .single();

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          timestamp_iso: isoNow(),
          type: 'add',
          sku,
          location_id: locationId,
          quantity,
          reason: reason || 'added item',
          note,
          item_name: itemData?.name,
          location_name: locationData?.name,
        });

      if (auditError) throw auditError;

      // Update local state
      set((state) => {
        const key = buildStockKey(sku, locationId);
        return {
          stockByLocation: { ...state.stockByLocation, [key]: newQuantity }
        };
      });
    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  },

  deductStock: async (sku, locationId, quantity, reason, note) => {
    if (quantity <= 0 || !Number.isInteger(quantity)) return;

    try {
      // Get current stock
      const { data: currentStock, error: stockError } = await supabase
        .from('stock_by_location')
        .select('quantity')
        .eq('sku', sku)
        .eq('location_id', locationId)
        .single();

      const currentQuantity = currentStock?.quantity || 0;
      if (quantity > currentQuantity) {
        throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`);
      }

      const newQuantity = currentQuantity - quantity;

      // Update stock
      const { error: updateError } = await supabase
        .from('stock_by_location')
        .update({ quantity: newQuantity })
        .eq('sku', sku)
        .eq('location_id', locationId);

      if (updateError) throw updateError;

      // Add audit record
      const { data: itemData } = await supabase
        .from('items')
        .select('name')
        .eq('sku', sku)
        .single();

      const { data: locationData } = await supabase
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .single();

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          timestamp_iso: isoNow(),
          type: 'deduct',
          sku,
          location_id: locationId,
          quantity,
          reason: reason || 'deducted item',
          note,
          item_name: itemData?.name,
          location_name: locationData?.name,
        });

      if (auditError) throw auditError;

      // Update local state
      set((state) => {
        const key = buildStockKey(sku, locationId);
        return {
          stockByLocation: { ...state.stockByLocation, [key]: newQuantity }
        };
      });
    } catch (error) {
      console.error('Error deducting stock:', error);
      throw error;
    }
  },

  transferStock: async (sku, fromLocationId, toLocationId, quantity, note) => {
    if (quantity <= 0 || !Number.isInteger(quantity)) return;

    try {
      // Get current stock from source location
      const { data: fromStock, error: fromError } = await supabase
        .from('stock_by_location')
        .select('quantity')
        .eq('sku', sku)
        .eq('location_id', fromLocationId)
        .single();

      if (fromError && fromError.code !== 'PGRST116') throw fromError;

      const fromQuantity = fromStock?.quantity || 0;
      if (quantity > fromQuantity) {
        throw new Error(`Insufficient stock in source location. Available: ${fromQuantity}, Requested: ${quantity}`);
      }

      // Get current stock from destination location
      const { data: toStock, error: toError } = await supabase
        .from('stock_by_location')
        .select('quantity')
        .eq('sku', sku)
        .eq('location_id', toLocationId)
        .single();

      if (toError && toError.code !== 'PGRST116') throw toError;

      const toQuantity = toStock?.quantity || 0;

      // Update both locations
      const { error: updateFromError } = await supabase
        .from('stock_by_location')
        .upsert({
          sku,
          location_id: fromLocationId,
          quantity: fromQuantity - quantity,
        }, { onConflict: 'sku,location_id' });

      if (updateFromError) throw updateFromError;

      const { error: updateToError } = await supabase
        .from('stock_by_location')
        .upsert({
          sku,
          location_id: toLocationId,
          quantity: toQuantity + quantity,
        }, { onConflict: 'sku,location_id' });

      if (updateToError) throw updateToError;

      // Add audit record
      const { data: itemData } = await supabase
        .from('items')
        .select('name')
        .eq('sku', sku)
        .single();

      const { data: fromLocationData } = await supabase
        .from('locations')
        .select('name')
        .eq('id', fromLocationId)
        .single();

      const { data: toLocationData } = await supabase
        .from('locations')
        .select('name')
        .eq('id', toLocationId)
        .single();

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          timestamp_iso: isoNow(),
          type: 'transfer',
          sku,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          quantity,
          note,
          item_name: itemData?.name,
          from_location_name: fromLocationData?.name,
          to_location_name: toLocationData?.name,
        });

      if (auditError) throw auditError;

      // Update local state
      set((state) => {
        const fromKey = buildStockKey(sku, fromLocationId);
        const toKey = buildStockKey(sku, toLocationId);
        return {
          stockByLocation: {
            ...state.stockByLocation,
            [fromKey]: fromQuantity - quantity,
            [toKey]: toQuantity + quantity,
          }
        };
      });
    } catch (error) {
      console.error('Error transferring stock:', error);
      throw error;
    }
  },

  // Audit trail
  getAuditTrail: async (filters) => {
    try {
      let query = supabase
        .from('audit_trail')
        .select('*')
        .order('timestamp_iso', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('timestamp_iso', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('timestamp_iso', filters.endDate.toISOString());
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.sku) {
        query = query.eq('sku', filters.sku);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(record => ({
        id: record.id,
        timestampIso: record.timestamp_iso,
        type: record.type,
        sku: record.sku,
        locationId: record.location_id,
        fromLocationId: record.from_location_id,
        toLocationId: record.to_location_id,
        quantity: record.quantity,
        reason: record.reason,
        note: record.note,
        userId: record.user_id,
        itemName: record.item_name,
        locationName: record.location_name,
        fromLocationName: record.from_location_name,
        toLocationName: record.to_location_name,
      }));
    } catch (error) {
      console.error('Error getting audit trail:', error);
      return [];
    }
  },

  // Export
  exportState: () => {
    const state = get();
    return {
      items: state.items,
      locations: state.locations,
      stockByLocation: state.stockByLocation,
      adjustments: state.adjustments,
      transfers: state.transfers,
      auditTrail: state.auditTrail,
      users: state.users,
      currentUserId: state.currentUserId,
      reasons: state.reasons,
    };
  },

  // Sync from database
  syncFromDatabase: async () => {
    try {
      // Fetch all data from database
      const [itemsResult, locationsResult, stockResult] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('locations').select('*'),
        supabase.from('stock_by_location').select('*'),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (locationsResult.error) throw locationsResult.error;
      if (stockResult.error) throw stockResult.error;

      // Transform data
      const items = itemsResult.data.reduce((acc, item) => {
        acc[item.sku] = {
          sku: item.sku,
          name: item.name,
          costPriceEuroCents: item.cost_price_euro_cents,
          sellingPriceEuroCents: item.selling_price_euro_cents,
          quantityKind: item.quantity_kind,
        };
        return acc;
      }, {} as Record<string, Item>);

      const locations = locationsResult.data.reduce((acc, location) => {
        acc[location.id] = {
          id: location.id,
          name: location.name,
        };
        return acc;
      }, {} as Record<string, Location>);

      const stockByLocation = stockResult.data.reduce((acc, stock) => {
        const key = buildStockKey(stock.sku, stock.location_id);
        acc[key] = stock.quantity;
        return acc;
      }, {} as Record<string, number>);

      // Update state
      set({
        items,
        locations,
        stockByLocation,
      });
    } catch (error) {
      console.error('Error syncing from database:', error);
      throw error;
    }
  },
}));
