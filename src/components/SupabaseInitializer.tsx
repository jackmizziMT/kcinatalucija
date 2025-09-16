"use client";

import { useEffect, useState } from "react";
import { useSupabaseInventoryStore } from "@/store/supabaseStore";

export function SupabaseInitializer() {
  const initialize = useSupabaseInventoryStore((state) => state.initialize);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const performInitialization = async () => {
      try {
        console.log('Initializing Supabase store...');
        
        // Add timeout to prevent hanging
        const initPromise = initialize();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 15000)
        );
        
        await Promise.race([initPromise, timeoutPromise]);
        
        if (isMounted) {
          console.log('Supabase store initialized successfully');
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Supabase store:', error);
        if (isMounted) {
          // Still mark as initialized to prevent infinite loading
          setIsInitialized(true);
        }
      }
    };

    // Only initialize once
    if (!isInitialized) {
      performInitialization();
    }

    return () => {
      isMounted = false;
    };
  }, [initialize, isInitialized]);

  // This component doesn't render anything
  return null;
}
