'use client';

import { useEffect, useState } from 'react';

interface Variant {
  size: string;
  color: string;
  stock: number;
  sku?: string;
}

interface VariantStockMatrixProps {
  sizes: string[];
  colors: string[];
  value: Variant[];
  onChange: (variants: Variant[]) => void;
}

export function VariantStockMatrix({ sizes, colors, value, onChange }: VariantStockMatrixProps) {
  const [variants, setVariants] = useState<Variant[]>(value);

  // Generate all possible combinations when sizes or colors change
  useEffect(() => {
    if (sizes.length === 0 || colors.length === 0) {
      setVariants([]);
      onChange([]);
      return;
    }

    const newVariants: Variant[] = [];
    
    for (const size of sizes) {
      for (const color of colors) {
        // Check if this variant already exists
        const existing = variants.find(v => v.size === size && v.color === color);
        
        if (existing) {
          // Keep existing data
          newVariants.push(existing);
        } else {
          // Create new variant with default stock of 0
          newVariants.push({
            size,
            color,
            stock: 0,
            sku: `${size}-${color}`.toUpperCase().replace(/\s+/g, '-'),
          });
        }
      }
    }

    setVariants(newVariants);
    onChange(newVariants);
  }, [sizes, colors]);

  const updateStock = (size: string, color: string, stock: number) => {
    const updatedVariants = variants.map(v => {
      if (v.size === size && v.color === color) {
        return { ...v, stock: Math.max(0, stock) }; // Ensure non-negative
      }
      return v;
    });
    
    setVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const setAllStock = (stock: number) => {
    const updatedVariants = variants.map(v => ({ ...v, stock: Math.max(0, stock) }));
    setVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const getVariantStock = (size: string, color: string): number => {
    const variant = variants.find(v => v.size === size && v.color === color);
    return variant?.stock ?? 0;
  };

  const getTotalStock = (): number => {
    return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  if (sizes.length === 0 || colors.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-line rounded-lg text-center">
        <p className="text-bmr-muted mb-2">No variants to configure</p>
        <p className="text-sm text-bmr-muted">
          Please select at least one size and one color to manage stock levels
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Total Stock */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Stock Management</h3>
          <p className="text-sm text-bmr-muted">
            Set stock levels for each size and color combination
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-bmr-muted">Total Stock</p>
          <p className="text-2xl font-bold text-bmr-ink">{getTotalStock()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 p-4 bg-surface-3 rounded-lg">
        <label className="text-sm font-medium">Quick Set All:</label>
        <input
          type="number"
          min="0"
          placeholder="0"
          className="w-24 px-3 py-2 border border-line rounded focus:outline-none focus:ring-2 focus:ring-bmr-ink"
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            if (value >= 0) setAllStock(value);
          }}
        />
        <span className="text-sm text-bmr-muted">
          Set the same stock level for all variants
        </span>
      </div>

      {/* Stock Matrix */}
      <div className="border border-line rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-3 border-b border-line">
                <th className="px-4 py-3 text-left text-sm font-medium sticky left-0 bg-surface-3 z-10">
                  Size / Color
                </th>
                {colors.map((color) => (
                  <th
                    key={color}
                    className="px-4 py-3 text-center text-sm font-medium min-w-[120px]"
                  >
                    {color}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((size, sizeIndex) => (
                <tr
                  key={size}
                  className={`border-b border-line ${
                    sizeIndex % 2 === 0 ? 'bg-surface-2' : 'bg-surface-1'
                  }`}
                >
                  <td className="px-4 py-3 font-medium sticky left-0 z-10 bg-inherit">
                    {size}
                  </td>
                  {colors.map((color) => {
                    const stock = getVariantStock(size, color);
                    const isLowStock = stock > 0 && stock <= 5;
                    const isOutOfStock = stock === 0;

                    return (
                      <td key={`${size}-${color}`} className="px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={stock}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              updateStock(size, color, value);
                            }}
                            className={`w-full px-3 py-2 border rounded text-center focus:outline-none focus:ring-2 transition-colors ${
                              isOutOfStock
                                ? 'border-bmr-acc-red focus:ring-bmr-acc-red bg-bmr-acc-red/5'
                                : isLowStock
                                ? 'border-yellow-500 focus:ring-yellow-500 bg-yellow-50'
                                : 'border-line focus:ring-bmr-ink'
                            }`}
                          />
                          {isOutOfStock && (
                            <span className="text-xs text-bmr-acc-red font-medium">
                              Out of Stock
                            </span>
                          )}
                          {isLowStock && (
                            <span className="text-xs text-yellow-600 font-medium">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-3 rounded-lg">
        <div>
          <p className="text-sm text-bmr-muted">Total Variants</p>
          <p className="text-xl font-bold">{variants.length}</p>
        </div>
        <div>
          <p className="text-sm text-bmr-muted">In Stock</p>
          <p className="text-xl font-bold text-bmr-acc-green">
            {variants.filter(v => v.stock > 0).length}
          </p>
        </div>
        <div>
          <p className="text-sm text-bmr-muted">Low Stock</p>
          <p className="text-xl font-bold text-yellow-600">
            {variants.filter(v => v.stock > 0 && v.stock <= 5).length}
          </p>
        </div>
        <div>
          <p className="text-sm text-bmr-muted">Out of Stock</p>
          <p className="text-xl font-bold text-bmr-acc-red">
            {variants.filter(v => v.stock === 0).length}
          </p>
        </div>
      </div>

      {/* Helper Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Stock levels are tracked per size+color combination. 
          Use "Quick Set All" to set the same stock for all variants, then adjust individual 
          variants as needed. Low stock (≤5) and out of stock (0) variants are highlighted.
        </p>
      </div>
    </div>
  );
}


