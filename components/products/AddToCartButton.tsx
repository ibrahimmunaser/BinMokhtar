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
      className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ShoppingBag className="w-5 h-5" />
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}

