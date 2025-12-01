'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, Heart, Share2, Package, Truck } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { useState } from 'react';

export function CartTable() {
  const items = useCartStore((state) => state.items);
  const setQty = useCartStore((state) => state.setQty);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);
  const { currency } = useLocale();
  
  const [savedForLater, setSavedForLater] = useState<string[]>([]);
  const [giftItems, setGiftItems] = useState<string[]>([]);

  // Calculate free shipping threshold
  const total = useCartStore((state) => state.total());
  const freeShippingThreshold = 10000; // $100 in cents
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const qualifiesForFreeShipping = total >= freeShippingThreshold;

  // Check if any items are missing critical data
  const hasInvalidItems = items.some(item => !item.name && !item.title);
  
  // Get product name with fallback
  const getProductName = (item: any) => {
    return item.name || item.title || 'Unnamed Product';
  };
  
  // Get product image with fallback
  const getProductImage = (item: any) => {
    return item.image || item.imageUrl;
  };

  // Get estimated delivery date (3-5 business days from now)
  const getDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 4); // 4 days from now
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Handle save for later
  const handleSaveForLater = (itemId: string) => {
    setSavedForLater([...savedForLater, itemId]);
    // In a real app, you'd move this to a separate "saved items" store
    remove(itemId);
  };

  // Toggle gift option
  const toggleGift = (itemId: string) => {
    if (giftItems.includes(itemId)) {
      setGiftItems(giftItems.filter(id => id !== itemId));
    } else {
      setGiftItems([...giftItems, itemId]);
    }
  };

  // Handle share
  const handleShare = async (item: any) => {
    const productUrl = `${window.location.origin}/product/${item.slug || item.productId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: getProductName(item),
          text: `Check out ${getProductName(item)} at Bin Mukhtar Retail`,
          url: productUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(productUrl);
      alert('Product link copied to clipboard!');
    }
  };

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted opacity-50" />
        <p className="text-muted mb-6">Your cart is empty</p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-bmr-night text-surface-2 text-sm uppercase tracking-wideish hover:bg-bmr-night/90 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Free Shipping Banner */}
      {!qualifiesForFreeShipping && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Add {formatPrice(remainingForFreeShipping, currency)} more to qualify for <strong>FREE delivery</strong>
            </p>
            <p className="text-xs text-green-700 mt-1">
              Choose this option at checkout
            </p>
          </div>
        </div>
      )}

      {qualifiesForFreeShipping && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Your order qualifies for <strong>FREE delivery</strong>
            </p>
            <p className="text-xs text-green-700 mt-1">
              Choose this option at checkout
            </p>
          </div>
        </div>
      )}

      {/* Warning banner for invalid items */}
      {hasInvalidItems && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">Cart data issue detected</p>
              <p className="text-sm text-yellow-800">
                Some items in your cart are missing product information. This may be due to old cart data.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear cart and start fresh? This will remove all items.')) {
                  clear();
                }
              }}
              className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors whitespace-nowrap"
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}

      {/* Deselect all items link */}
      {items.length > 1 && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Shopping Cart ({items.length} items)</h2>
          <button
            onClick={() => {
              if (confirm('Remove all items from cart?')) {
                clear();
              }
            }}
            className="text-sm text-bmr-ink hover:text-bmr-fg hover:underline"
          >
            Deselect all items
          </button>
        </div>
      )}

      {/* Cart Items */}
      {items.map((item) => {
        const itemTotal = (item.price || item.priceAtAdd) * item.qty;
        const unitPrice = item.price || item.priceAtAdd;
        const isGift = giftItems.includes(item.id);

        return (
          <div key={item.id} className="pb-6 border-b border-border last:border-0">
            <div className="flex gap-6">
              {/* Larger Thumbnail - Amazon style */}
              <Link
                href={`/product/${item.slug || item.productId}`}
                className="w-32 h-40 bg-surface-3 relative flex-shrink-0 rounded overflow-hidden hover:opacity-90 transition-opacity"
              >
                {getProductImage(item) && (
                  <Image
                    src={getProductImage(item) || ''}
                    alt={getProductName(item)}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                )}
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                {/* Product Name */}
                <Link 
                  href={`/product/${item.slug || item.productId}`} 
                  className="font-medium text-base hover:text-bmr-ink hover:underline block mb-2"
                >
                  {getProductName(item)}
                </Link>

                {/* Stock Status - Amazon style */}
                <div className="mb-2">
                  <span className="inline-flex items-center text-sm font-medium text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    In Stock
                  </span>
                </div>

                {/* Delivery Info */}
                <p className="text-sm text-bmr-fg mb-2">
                  <strong>FREE delivery</strong> <span className="font-semibold">{getDeliveryDate()}</span> available at checkout
                </p>

                {/* Variants */}
                {(item.size || item.color || item.sleeve || item.length) && (
                  <div className="mb-3 text-sm text-bmr-muted">
                    {item.size && <div><strong>Size:</strong> {item.size}</div>}
                    {item.color && <div><strong>Color:</strong> <span className="capitalize">{item.color}</span></div>}
                    {(item.sleeve || item.length) && <div><strong>Style:</strong> <span className="capitalize">{item.sleeve || item.length}</span></div>}
                  </div>
                )}

                {/* Gift Option */}
                <div className="mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={isGift}
                      onChange={() => toggleGift(item.id)}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                    <span>This is a gift</span>
                    <Link href="#" className="text-bmr-ink hover:text-bmr-fg hover:underline ml-1">
                      Learn more
                    </Link>
                  </label>
                </div>

                {/* Quantity Controls - Amazon style with border */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="inline-flex items-center border-2 border-border rounded-lg overflow-hidden bg-surface-1">
                    <button
                      onClick={() => setQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="px-3 py-1.5 hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        setQty(item.id, Math.max(1, qty));
                      }}
                      className="w-12 py-1.5 text-center text-sm border-x-2 border-border bg-surface-2 focus:outline-none focus:bg-white"
                      min="1"
                    />
                    <button
                      onClick={() => setQty(item.id, item.qty + 1)}
                      className="px-3 py-1.5 hover:bg-surface-3 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price Display - Unit + Total */}
                  <div className="text-sm">
                    <div className="font-bold text-xl text-bmr-fg">
                      {formatPrice(itemTotal, currency)}
                    </div>
                    {item.qty > 1 && (
                      <div className="text-xs text-bmr-muted">
                        ({formatPrice(unitPrice, currency)} / count)
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions - Amazon style */}
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => remove(item.id)}
                    className="text-bmr-ink hover:text-bmr-fg hover:underline font-medium"
                  >
                    Delete
                  </button>
                  <span className="text-border">|</span>
                  <button
                    onClick={() => handleSaveForLater(item.id)}
                    className="text-bmr-ink hover:text-bmr-fg hover:underline font-medium"
                  >
                    Save for later
                  </button>
                  <span className="text-border">|</span>
                  <button
                    onClick={() => handleShare(item)}
                    className="text-bmr-ink hover:text-bmr-fg hover:underline font-medium"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Subtotal at bottom - Amazon style */}
      <div className="pt-4 flex justify-end">
        <div className="text-right">
          <p className="text-lg">
            Subtotal ({items.reduce((acc, item) => acc + item.qty, 0)} items): <span className="font-bold text-xl">{formatPrice(total, currency)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
