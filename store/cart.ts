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

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, qty: i.qty + item.qty } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, id }] });
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
          return sum + unit * item.qty;
        }, 0);
      },

      count: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    {
      name: 'bmr-cart-storage',
    }
  )
);



