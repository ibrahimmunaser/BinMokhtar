'use client';

import { Minus, Plus } from 'lucide-react';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function QtyStepper({ value, onChange, max = 99 }: QtyStepperProps) {
  const decrease = () => {
    if (value > 1) onChange(value - 1);
  };

  const increase = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">Quantity</div>
      <div className="flex items-center border border-border w-fit">
        <button
          onClick={decrease}
          disabled={value <= 1}
          className="px-4 py-3 hover:bg-border transition-colors disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-6 py-3 text-sm font-medium min-w-[60px] text-center">{value}</span>
        <button
          onClick={increase}
          disabled={value >= max}
          className="px-4 py-3 hover:bg-border transition-colors disabled:opacity-30"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}




