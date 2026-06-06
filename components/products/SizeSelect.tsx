'use client';

// Utility function to normalize/validate size labels
function normalizeSizeLabel(size: string): string {
  if (!size) return '';
  
  // Trim whitespace
  const trimmed = size.trim();
  
  // Check for malformed sizes like "60/26" (should likely be "60/2XL" or similar)
  // Pattern: number/number instead of number/letter
  const malformedPattern = /^(\d+)\/(\d+)$/;
  const match = trimmed.match(malformedPattern);
  
  if (match) {
    // Log warning for debugging
    console.warn(`⚠️ Potentially malformed size detected: "${trimmed}". Consider updating product data.`);
    // Return as-is but could be enhanced to auto-correct common patterns
  }
  
  return trimmed;
}

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
    const normSize = String(size ?? '').trim();
    // If we have variants and a selected color, check the specific combination
    if (variants && variants.length > 0) {
      if (selectedColor) {
        const normColor = String(selectedColor ?? '').trim();
        const variant = variants.find(
          v =>
            String(v.size ?? '').trim() === normSize &&
            String(v.color ?? '').trim() === normColor
        );
        return variant?.stock ?? 0;
      } else {
        const sizeVariants = variants.filter(
          v => String(v.size ?? '').trim() === normSize
        );
        return sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      }
    }
    
    if (stockBySize) {
      return stockBySize[size] ?? 0;
    }
    
    return 999;
  };

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">Select Size</div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const normalizedSize = normalizeSizeLabel(size);
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
              {normalizedSize}
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








