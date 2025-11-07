'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface AddToCartButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddToCartButton({ onClick, disabled = false }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = () => {
    setIsAdding(true);
    onClick();
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isAdding}
      className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-bmr-ink text-surface-2 font-medium hover:bg-bmr-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
    >
      <ShoppingBag className="w-5 h-5" />
      {isAdding ? 'Added to cart' : 'Add to cart'}
    </button>
  );
}

