/**
 * Checkout Store
 * Manages checkout state that needs to be shared between components
 */

import { create } from 'zustand';
import type { FulfillmentMethod, ShippingRate } from '@/lib/shipping/config';

interface CheckoutState {
  fulfillmentMethod: FulfillmentMethod;
  selectedRate: ShippingRate | null;
  shippingCost: number; // in cents
  
  // Actions
  setFulfillmentMethod: (method: FulfillmentMethod) => void;
  setSelectedRate: (rate: ShippingRate | null) => void;
  setShippingCost: (cost: number) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  fulfillmentMethod: 'pickup',
  selectedRate: null,
  shippingCost: 0,
  
  setFulfillmentMethod: (method) => set({ fulfillmentMethod: method }),
  setSelectedRate: (rate) => set({ selectedRate: rate }),
  setShippingCost: (cost) => set({ shippingCost: cost }),
  reset: () => set({ 
    fulfillmentMethod: 'pickup', 
    selectedRate: null, 
    shippingCost: 0 
  }),
}));








