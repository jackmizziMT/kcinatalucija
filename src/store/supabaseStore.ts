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
  BookingRecord,
} from "@/lib/types";

type AddItemInput = Omit<Item, "sku"> & { sku: string };

interface InventoryActions {
  // Items
  addItem: (item: AddItemInput) => Promise<void>;
  updateItem: (sku: string, updates: Partial<Omit<Item, "sku">>) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  importItems: (items: Item[]) => Promise<void>;
  checkSkuExists: (sku: string) => Promise<boolean>;

  // Locations
  addLocation: (location: Omit<Location, "id">) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Omit<Location, "id">>) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;

  // Stock operations
  addStock: (sku: string, locationId: string, quantity: number, reason?: string, note?: string) => Promise<void>;
  deductStock: (sku: string, locationId: string, quantity: number, reason?: string, note?: string) => Promise<void>;
  transferStock: (sku: string, fromLocationId: string, toLocationId: string, quantity: number, note?: string) => Promise<void>;

  // Bookings
  fetchBooking: (sku: string) => Promise<void>;
  adjustBookingQuantity: (sku: string, delta: number) => Promise<void>;
  updateBookingNote: (sku: string, note: string) => Promise<void>;

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
  
  // Initialize
  initialize: () => Promise<void>;
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
  bookings: {},

  // Items
  checkSkuExists: async (sku) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('sku')
        .eq('sku', sku)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found - SKU doesn't exist
        return false;
      }
      
      if (error) {
        console.error('Error checking SKU:', error);
        throw error;
      }

      return !!data; // SKU exists
    } catch (error) {
      console.error('Error checking SKU existence:', error);
      throw error;
    }
  },

  addItem: async (item) => {
    try {
      console.log('Adding item:', item);
      
      // Check if SKU already exists
      const skuExists = await get().checkSkuExists(item.sku);
      if (skuExists) {
        throw new Error(`SKU "${item.sku}" already exists. Please use a different SKU.`);
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
      });
      
      const insertPromise = supabase
        .from('items')
        .insert({
          sku: item.sku,
          name: item.name,
          selling_price_euro_cents: item.sellingPriceEuroCents,
          quantity_kind: item.quantityKind,
        })
        .select()
        .single();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        // Check for duplicate key error
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          throw new Error(`SKU "${item.sku}" already exists. Please use a different SKU.`);
        }
        throw new Error(`Failed to add item: ${error.message}`);
      }

      set((state) => ({
        items: { ...state.items, [item.sku]: item }
      }));
      
      console.log('Item added successfully');
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
      console.log('Adding location:', location);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Location request timeout after 10 seconds')), 10000);
      });
      
      const insertPromise = supabase
        .from('locations')
        .insert({ name: location.name })
        .select()
        .single();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

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
    try {
      console.log('Transferring stock:', { sku, fromLocationId, toLocationId, quantity, note });
      
      if (!sku || !fromLocationId || !toLocationId || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Invalid transfer parameters');
      }

      if (fromLocationId === toLocationId) {
        throw new Error('Source and destination locations must be different');
      }

      // Increase timeout to 15 seconds for complex operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transfer request timeout after 15 seconds')), 15000);
      });
      
      // Get current stock from both locations in a single query
      console.log('Fetching current stock...');
      const stockQuery = supabase
        .from('stock_by_location')
        .select('location_id, quantity')
        .eq('sku', sku)
        .in('location_id', [fromLocationId, toLocationId]);

      const stockResponse = await Promise.race([stockQuery, timeoutPromise]) as any;

      if (stockResponse.error) throw stockResponse.error;

      const stockData = stockResponse.data ?? [];

      const fromStock = stockData.find((s: any) => s.location_id === fromLocationId);
      const toStock = stockData.find((s: any) => s.location_id === toLocationId);
      
      const fromQuantity = fromStock?.quantity || 0;
      const toQuantity = toStock?.quantity || 0;

      if (quantity > fromQuantity) {
        throw new Error(`Insufficient stock in source location. Available: ${fromQuantity}, Requested: ${quantity}`);
      }

      console.log('Stock check passed, updating quantities...');

      // Update both locations in parallel
      const updatePromises = [
        supabase
          .from('stock_by_location')
          .upsert({
            sku,
            location_id: fromLocationId,
            quantity: fromQuantity - quantity,
          }, { onConflict: 'sku,location_id' }),
        supabase
          .from('stock_by_location')
          .upsert({
            sku,
            location_id: toLocationId,
            quantity: toQuantity + quantity,
          }, { onConflict: 'sku,location_id' })
      ];

      const updateResponses = await Promise.race([
        Promise.all(updatePromises),
        timeoutPromise,
      ]) as any;
      
      if (updateResponses[0].error) throw updateResponses[0].error;
      if (updateResponses[1].error) throw updateResponses[1].error;

      console.log('Stock updated, creating audit record...');

      // Get item and location names for audit record (simplified)
      const itemName = get().items[sku]?.name || 'Unknown Item';
      const fromLocationName = get().locations[fromLocationId]?.name || 'Unknown Location';
      const toLocationName = get().locations[toLocationId]?.name || 'Unknown Location';

      // Add audit record
      const auditResponse = await Promise.race([
        supabase
          .from('audit_trail')
          .insert({
            timestamp_iso: isoNow(),
            type: 'transfer',
            sku,
            from_location_id: fromLocationId,
            to_location_id: toLocationId,
            quantity,
            note,
            item_name: itemName,
            from_location_name: fromLocationName,
            to_location_name: toLocationName,
          }),
        timeoutPromise,
      ]) as any;

      if (auditResponse.error) {
        console.warn('Audit record creation failed:', auditResponse.error);
        // Don't throw - the transfer still succeeded
      }

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
      
      console.log('Transfer completed successfully');
    } catch (error) {
      console.error('Error transferring stock:', error);
      throw error;
    }
  },

  fetchBooking: async (sku) => {
    if (!sku) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('quantity, note')
        .eq('sku', sku)
        .maybeSingle();

      if (error && error.code === '42P01') {
        console.warn('Bookings table not found; returning default booking');
        set((state) => ({
          bookings: {
            ...state.bookings,
            [sku]: { quantity: 0, note: '' },
          },
        }));
        return;
      }

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const booking: BookingRecord = {
        quantity: data?.quantity ?? 0,
        note: data?.note ?? '',
      };

      if ((!data || !data.note) && typeof window !== 'undefined') {
        try {
          const stored = window.localStorage.getItem('productReportBookedNotes');
          if (stored) {
            const parsed = JSON.parse(stored);
            const legacyNote = parsed?.[sku];
            if (legacyNote && !booking.note) {
              booking.note = legacyNote;
              await supabase
                .from('bookings')
                .upsert({ sku, quantity: booking.quantity, note: legacyNote }, { onConflict: 'sku' });
            }
          }
        } catch (error) {
          console.warn('Failed to import legacy note for', sku, error);
        }
      }

      set((state) => ({
        bookings: {
          ...state.bookings,
          [sku]: booking,
        },
      }));
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  adjustBookingQuantity: async (sku, delta) => {
    if (!sku) return;

    const current = get().bookings[sku] ?? { quantity: 0, note: '' };
    const next = {
      ...current,
      quantity: Math.max(0, current.quantity + delta),
    };

    if (next.quantity === current.quantity) {
      return;
    }

    set((state) => ({
      bookings: {
        ...state.bookings,
        [sku]: next,
      },
    }));

    try {
      const { error } = await supabase
        .from('bookings')
        .upsert({
          sku,
          quantity: next.quantity,
          note: next.note,
        }, { onConflict: 'sku' });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Bookings table not found; skipping persistence of quantity');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error adjusting booking quantity:', error);
      set((state) => ({
        bookings: {
          ...state.bookings,
          [sku]: current,
        },
      }));
      throw error;
    }
  },

  updateBookingNote: async (sku, note) => {
    if (!sku) return;

    const current = get().bookings[sku] ?? { quantity: 0, note: '' };
    const next: BookingRecord = {
      quantity: current.quantity,
      note,
    };

    set((state) => ({
      bookings: {
        ...state.bookings,
        [sku]: next,
      },
    }));

    try {
      const { error } = await supabase
        .from('bookings')
        .upsert({
          sku,
          quantity: next.quantity,
          note: next.note,
        }, { onConflict: 'sku' });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Bookings table not found; skipping persistence of note');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating booking note:', error);
      set((state) => ({
        bookings: {
          ...state.bookings,
          [sku]: current,
        },
      }));
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

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Audit trail request timeout after 10 seconds')), 10000);
      });
      
      const { data, error } = await Promise.race([query, timeoutPromise]) as any;
      if (error) throw error;

      return data.map((record: any) => ({
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
      bookings: state.bookings,
    };
  },

  // Sync from database
  syncFromDatabase: async () => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sync request timeout after 15 seconds')), 15000);
      });
      
      // Fetch all data from database
      const syncPromise = Promise.all([
        supabase.from('items').select('*'),
        supabase.from('locations').select('*'),
        supabase.from('stock_by_location').select('*'),
        supabase.from('bookings').select('*'),
      ]);
      
      const [itemsResult, locationsResult, stockResult, bookingsResult] = await Promise.race([syncPromise, timeoutPromise]) as any;

      console.log('[syncFromDatabase] items:', itemsResult);
      console.log('[syncFromDatabase] locations:', locationsResult);
      console.log('[syncFromDatabase] stock_by_location:', stockResult);
      console.log('[syncFromDatabase] bookings:', bookingsResult);

      if (itemsResult.error) throw itemsResult.error;
      if (locationsResult.error) throw locationsResult.error;
      if (stockResult.error) throw stockResult.error;
      const bookingsError = bookingsResult.error;
      if (bookingsError && bookingsError.code !== '42P01') {
        throw bookingsError;
      }

      // Transform data
      const items = itemsResult.data.reduce((acc: any, item: any) => {
        acc[item.sku] = {
          sku: item.sku,
          name: item.name,
          sellingPriceEuroCents: item.selling_price_euro_cents,
          quantityKind: item.quantity_kind,
        };
        return acc;
      }, {} as Record<string, Item>);

      const locations = locationsResult.data.reduce((acc: any, location: any) => {
        acc[location.id] = {
          id: location.id,
          name: location.name,
        };
        return acc;
      }, {} as Record<string, Location>);

      const stockByLocation = stockResult.data.reduce((acc: any, stock: any) => {
        const key = buildStockKey(stock.sku, stock.location_id);
        acc[key] = stock.quantity;
        return acc;
      }, {} as Record<string, number>);

      const bookingsData = bookingsError ? [] : bookingsResult.data ?? [];

      const bookings = bookingsData.reduce((acc: Record<string, BookingRecord>, booking: any) => {
        acc[booking.sku] = {
          quantity: booking.quantity ?? 0,
          note: booking.note ?? '',
        };
        return acc;
      }, {});

      let legacyNotes: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        try {
          const stored = window.localStorage.getItem('productReportBookedNotes');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
              legacyNotes = parsed;
            }
          }
        } catch (error) {
          console.warn('Failed to read legacy booked notes from storage', error);
        }
      }

      const upserts: { sku: string; quantity: number; note: string }[] = [];

      Object.entries(legacyNotes).forEach(([sku, note]) => {
        if (!bookings[sku] && note) {
          bookings[sku] = {
            quantity: 0,
            note,
          };
          upserts.push({ sku, quantity: 0, note });
        }
      });
 
      // Update state
      set({
        items,
        locations,
        stockByLocation,
        bookings,
      });

      if (upserts.length > 0) {
        try {
          await supabase
            .from('bookings')
            .upsert(upserts, { onConflict: 'sku' });

          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('productReportBookedNotes');
          }
        } catch (error) {
          console.error('Failed to persist legacy booked notes', error);
        }
      }
    } catch (error) {
      console.error('Error syncing from database:', error);
      throw error;
    }
  },

  // Initialize - load data from Supabase when app starts
  initialize: async () => {
    try {
      console.log('Initializing Supabase store...');
      
      // Add timeout to prevent hanging
      const syncPromise = get().syncFromDatabase();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 15000)
      );
      
      await Promise.race([syncPromise, timeoutPromise]);
      console.log('Supabase store initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase store:', error);
      // Don't throw - let the app continue with empty state
      // This prevents the app from getting stuck
    }
  },
}));
