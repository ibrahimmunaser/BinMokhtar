'use client';

interface SizeSelectProps {
  sizes: string[];
  selected: string | null;
  onChange: (size: string) => void;
  // Stock per size (optional - if not provided, all sizes are available)
  stockBySize?: Record<string, number>;
  // Selected color to check combination stock
  selectedColor?: string | null;
  // Full variants array for size+color stock checking
  variants?: Array<{ size?: string; color?: string; stock: number }>;
}

export function SizeSelect({ 
  sizes, 
  selected, 
  onChange, 
  stockBySize,
  selectedColor,
  variants 
}: SizeSelectProps) {
  const handleClick = (size: string, isOutOfStock: boolean) => {
    if (isOutOfStock) return; // Don't allow selecting out-of-stock sizes
    
    // Toggle: if already selected, deselect it
    if (selected === size) {
      onChange(null as any);
    } else {
      onChange(size);
    }
  };

  // Get stock for a specific size (considering selected color if applicable)
  const getStockForSize = (size: string): number => {
    // If we have variants and a selected color, check the specific combination
    if (variants && variants.length > 0) {
      if (selectedColor) {
        // Find the specific size+color variant
        const variant = variants.find(v => v.size === size && v.color === selectedColor);
        return variant?.stock ?? 0;
      } else {
        // No color selected, sum stock across all colors for this size
        const sizeVariants = variants.filter(v => v.size === size);
        return sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      }
    }
    
    // Fall back to stockBySize if provided
    if (stockBySize) {
      return stockBySize[size] ?? 0;
    }
    
    // Default: assume available
    return 999;
  };

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">Select Size</div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const stock = getStockForSize(size);
          const isOutOfStock = stock === 0;
          
          return (
            <button
              key={size}
              type="button"
              onClick={() => handleClick(size, isOutOfStock)}
              disabled={isOutOfStock}
              className={`px-6 py-3 border text-sm transition-colors rounded relative ${
                isOutOfStock
                  ? 'border-line text-bmr-muted cursor-not-allowed bg-surface-3 line-through opacity-60'
                  : selected === size
                  ? 'border-bmr-ink bg-bmr-ink text-surface-2'
                  : 'border-line hover:border-bmr-ink'
              }`}
              title={isOutOfStock ? 'Out of stock' : `${stock} in stock`}
            >
              {size}
              {isOutOfStock && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-bmr-acc-red rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      {sizes.some(size => getStockForSize(size) === 0) && (
        <p className="text-xs text-bmr-muted mt-2">
          <span className="inline-block w-2 h-2 bg-bmr-acc-red rounded-full mr-1" />
          Crossed-out sizes are currently out of stock
        </p>
      )}
    </div>
  );
}








