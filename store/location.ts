/**
 * Location/Zone Store
 * Manages customer delivery location state with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationZone, DeliveryZone } from '@/lib/shipping/config';

// ============================================================
// MIGRATION: Clear stuck address BEFORE store is created
// This MUST run before Zustand's persist middleware rehydrates
// ============================================================
const MIGRATION_FLAG = 'bmr-location-migrated-v4'; // Increment version to force new migration
const STORAGE_KEY = 'bmr-location-v3'; // New key to ensure fresh start

// Run migration synchronously at module load time
if (typeof window !== 'undefined') {
  try {
    const migrated = localStorage.getItem(MIGRATION_FLAG);
    if (!migrated) {
      console.log('🚨 MIGRATION: Running BEFORE store creation');
      // Clear ALL old location keys
      localStorage.removeItem('bmr-location-storage');
      localStorage.removeItem('bmr-location-v2');
      localStorage.removeItem('bmr-location-v3');
      // Set migration flag
      localStorage.setItem(MIGRATION_FLAG, Date.now().toString());
      console.log('🚨 MIGRATION: Complete - all location keys cleared');
    }
  } catch (e) {
    console.error('🚨 MIGRATION: Error', e);
  }
}

interface LocationState {
  // Current location zone data
  locationZone: LocationZone | null;
  
  // Loading state for async operations
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Hydration flag to prevent SSR mismatch
  isHydrated: boolean;
  
  // Actions
  setLocationZone: (zone: LocationZone) => void;
  clearLocationZone: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  
  // Computed helpers
  isLocalDeliveryAvailable: () => boolean;
  getZone: () => DeliveryZone | null;
  getDisplayAddress: () => string;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      locationZone: null,
      isLoading: false,
      error: null,
      isHydrated: false,

      setLocationZone: (zone) => {
        console.log('🔄 Store: setLocationZone called');
        console.log('🔄 Store: New zone.formattedAddress:', zone.formattedAddress);
        console.log('🔄 Store: New zone.street:', zone.street);
        
        // Get current zone before update
        const currentZone = get().locationZone;
        console.log('🔄 Store: Old zone.formattedAddress:', currentZone?.formattedAddress);
        
        // Check if address actually changed
        const addressChanged = currentZone?.formattedAddress !== zone.formattedAddress;
        console.log('🔄 Store: Address changed?', addressChanged);
        
        // Update the store
        set({ locationZone: zone, error: null });
        console.log('🔄 Store: set() called');
        
        // Verify the update immediately
        const afterSet = get().locationZone;
        console.log('🔄 Store: After set(), locationZone:', afterSet?.formattedAddress);
        
        // Force persist to localStorage manually as backup
        try {
          const dataToStore = JSON.stringify({
            state: { locationZone: zone },
            version: 0
          });
          localStorage.setItem(STORAGE_KEY, dataToStore);
          console.log('🔄 Store: ✅ Manually persisted to localStorage key:', STORAGE_KEY);
          
          // Verify localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          const parsed = JSON.parse(stored || '{}');
          console.log('🔄 Store: ✅ localStorage now has:', parsed?.state?.locationZone?.formattedAddress);
        } catch (e) {
          console.error('🔄 Store: ❌ Error persisting to localStorage:', e);
        }
      },

      clearLocationZone: () => {
        console.log('🗑️ Store: clearLocationZone called');
        set({ locationZone: null, error: null });
        
        // Force clear ALL localStorage keys directly
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('bmr-location-v2');
          localStorage.removeItem('bmr-location-storage');
          console.log('🗑️ Store: All localStorage keys cleared');
        } catch (e) {
          console.error('🗑️ Store: Failed to clear localStorage:', e);
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },

      isLocalDeliveryAvailable: () => {
        const { locationZone } = get();
        return locationZone?.zone === 'local';
      },

      getZone: () => {
        const { locationZone } = get();
        return locationZone?.zone || null;
      },

      getDisplayAddress: () => {
        const { locationZone } = get();
        if (!locationZone) return '';
        
        if (locationZone.city && locationZone.state) {
          return `${locationZone.city}, ${locationZone.state}`;
        }
        
        return locationZone.formattedAddress || '';
      },
    }),
    {
      name: STORAGE_KEY, // Use the new key from migration
      // Only persist locationZone, not loading/error states
      partialize: (state) => {
        console.log('💾 Store: Persisting locationZone:', state.locationZone?.formattedAddress);
        return { locationZone: state.locationZone };
      },
      onRehydrateStorage: () => (state) => {
        console.log('💾 Store: Rehydrating from localStorage');
        console.log('💾 Store: Using storage key:', STORAGE_KEY);
        
        // Debug: Check what's in all storage keys
        try {
          const keys = ['bmr-location-storage', 'bmr-location-v2', 'bmr-location-v3'];
          keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              console.log(`💾 Store: Key ${key} has address:`, parsed?.state?.locationZone?.formattedAddress);
            } else {
              console.log(`💾 Store: Key ${key} is empty`);
            }
          });
        } catch (e) {
          console.error('💾 Store: Error checking storage:', e);
        }
        
        if (state) {
          console.log('💾 Store: Rehydrated locationZone:', state.locationZone?.formattedAddress);
          console.log('💾 Store: Rehydrated street:', state.locationZone?.street);
          console.log('💾 Store: Rehydrated city:', state.locationZone?.city);
          state.setHydrated(true);
        } else {
          console.log('💾 Store: No state found - fresh start');
        }
      },
    }
  )
);

/**
 * Hook to resolve location from API
 */
export async function resolveLocation(
  params: { address: string } | { lat: number; lng: number }
): Promise<LocationZone> {
  const response = await fetch('/api/shipping/resolve-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to resolve location');
  }

  return data.locationZone;
}

