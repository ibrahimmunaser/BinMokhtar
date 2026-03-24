import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'id'>) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

const generateCartItemId = (productId: string, size?: string, color?: string, sleeve?: string): string => {
  return `${productId}-${size || 'default'}-${color || 'default'}-${sleeve || 'default'}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        const id = generateCartItemId(item.productId, item.size, item.color, item.sleeve);
        const existing = get().items.find((i) => i.id === id);

        // STRICT price validation - prevent unrealistic thobe prices
        // Maximum reasonable price for a thobe: $500 (50000 cents)
        const MAX_REASONABLE_PRICE = 50000;
        const rawPrice = item.priceAtAdd || item.price || 0;
        
        // If price is over $500, something is wrong - cap it or reject it
        let sanitizedPrice = rawPrice;
        if (rawPrice > MAX_REASONABLE_PRICE) {
          console.error(`🚨 UNREALISTIC PRICE DETECTED: $${rawPrice / 100} for ${item.name || item.title}`);
          console.error('Product ID:', item.productId, 'Variant ID:', item.variantId);
          console.error('This price is likely a database error. Capping at $500.');
          sanitizedPrice = MAX_REASONABLE_PRICE;
        }
        
        const sanitizedItem = {
          ...item,
          priceAtAdd: sanitizedPrice,
          price: sanitizedPrice,
        };

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, qty: i.qty + item.qty } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...sanitizedItem, id }] });
        }
      },

      remove: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      setQty: (id, qty) => {
        if (qty <= 0) {
          get().remove(id);
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, qty } : i)),
        });
      },

      clear: () => {
        set({ items: [] });
      },

      total: () => {
        return get().items.reduce((sum, item) => {
          const unit = (item.price ?? item.priceAtAdd);
          // Sanitize prices during calculation - max $500 per item
          const MAX_REASONABLE_PRICE = 50000;
          const sanitizedPrice = Math.min(unit, MAX_REASONABLE_PRICE);
          
          if (unit > MAX_REASONABLE_PRICE) {
            console.error(`⚠️ Item in cart has unrealistic price: $${unit / 100}`);
          }
          
          return sum + sanitizedPrice * item.qty;
        }, 0);
      },

      count: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    {
      name: 'bmr-cart-storage',
      // Add migration to fix corrupted prices
      migrate: (persistedState: any, version: number) => {
        if (persistedState?.items) {
          // Fix corrupted prices
          // Maximum reasonable price for a thobe: $500 (50000 cents)
          const MAX_REASONABLE_PRICE = 50000;
          
          persistedState.items = persistedState.items.map((item: any) => {
            const price = item.price ?? item.priceAtAdd ?? 0;
            
            // If price is unrealistic (over $500), reset to 0 and log error
            if (price > MAX_REASONABLE_PRICE) {
              console.error(`⚠️ Corrupted/unrealistic price detected: $${price / 100} for ${item.name || item.title}`);
              console.error('Product ID:', item.productId, '- Resetting price to $0');
              return { ...item, price: 0, priceAtAdd: 0 };
            }
            
            return item;
          });
        }
        return persistedState;
      },
    }
  )
);



