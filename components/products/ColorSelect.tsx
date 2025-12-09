'use client';

interface ColorSelectProps {
  colors: string[];
  selected: string | null;
  onChange: (color: string) => void;
  // Selected size to check combination stock
  selectedSize?: string | null;
  // Full variants array for size+color stock checking
  variants?: Array<{ size?: string; color?: string; stock: number }>;
}

export function ColorSelect({ 
  colors, 
  selected, 
  onChange,
  selectedSize,
  variants 
}: ColorSelectProps) {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    gray: '#CACACA',
    beige: '#F5F5DC',
    brown: '#8B4513',
    navy: '#000080',
  };

  // Get stock for a specific color (considering selected size if applicable)
  const getStockForColor = (color: string): number => {
    if (variants && variants.length > 0) {
      if (selectedSize) {
        // Find the specific size+color variant
        const variant = variants.find(v => v.color === color && v.size === selectedSize);
        return variant?.stock ?? 0;
      } else {
        // No size selected, sum stock across all sizes for this color
        const colorVariants = variants.filter(v => v.color === color);
        return colorVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      }
    }
    
    // Default: assume available
    return 999;
  };

  const handleClick = (color: string, isOutOfStock: boolean) => {
    if (isOutOfStock) return; // Don't allow selecting out-of-stock colors
    
    // Toggle: if already selected, deselect it
    if (selected === color) {
      onChange(null as any);
    } else {
      onChange(color);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">
        Select Color{selected && <span className="capitalize">: {selected}</span>}
      </div>
      <div className="flex gap-3">
        {colors.map((color) => {
          const hexColor = colorMap[color.toLowerCase()] || '#CCCCCC';
          const stock = getStockForColor(color);
          const isOutOfStock = stock === 0;
          
          return (
            <button
              key={color}
              type="button"
              onClick={() => handleClick(color, isOutOfStock)}
              disabled={isOutOfStock}
              className={`w-10 h-10 border-2 transition-all rounded relative ${
                isOutOfStock
                  ? 'opacity-40 cursor-not-allowed'
                  : selected === color 
                  ? 'border-bmr-ink scale-110' 
                  : 'border-line hover:scale-105'
              }`}
              style={{ backgroundColor: hexColor }}
              aria-label={isOutOfStock ? `${color} - Out of stock` : color}
              title={isOutOfStock ? `${color} - Out of stock` : `${color} (${stock} in stock)`}
            >
              {isOutOfStock && (
                <>
                  {/* Diagonal line through the color */}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-full h-0.5 bg-bmr-acc-red rotate-45 transform origin-center" />
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}








