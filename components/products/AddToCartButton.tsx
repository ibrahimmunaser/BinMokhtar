'use client';

import { useState } from 'react';
import { ShoppingBag, XCircle } from 'lucide-react';

interface AddToCartButtonProps {
  onClick: () => void;
  disabled?: boolean;
  outOfStock?: boolean;
}

export function AddToCartButton({ onClick, disabled = false, outOfStock = false }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = () => {
    if (disabled || outOfStock) return;
    setIsAdding(true);
    onClick();
    setTimeout(() => setIsAdding(false), 1000);
  };

  // Determine button text
  const getButtonText = () => {
    if (isAdding) return 'Added to cart';
    if (outOfStock) return 'Out of Stock';
    if (disabled) return 'Select options';
    return 'Add to cart';
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isAdding || outOfStock}
      className={`w-full flex items-center justify-center gap-3 px-8 py-4 font-medium transition-colors rounded
        ${outOfStock 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : disabled 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-bmr-ink text-surface-2 hover:bg-bmr-fg'
        }
      `}
    >
      {outOfStock ? (
        <XCircle className="w-5 h-5" />
      ) : (
        <ShoppingBag className="w-5 h-5" />
      )}
      {getButtonText()}
    </button>
  );
}

