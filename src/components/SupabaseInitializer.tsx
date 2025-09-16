"use client";

import { useEffect } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";

export function SupabaseInitializer() {
  const initialize = useSupabaseInventoryStore((state) => state.initialize);

  useEffect(() => {
    // Initialize Supabase store when component mounts
    initialize();
  }, [initialize]);

  // This component doesn't render anything
  return null;
}
