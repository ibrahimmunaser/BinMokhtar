'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

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

  const deleteVariant = (size: string, color: string) => {
    const updatedVariants = variants.filter(v => !(v.size === size && v.color === color));
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

      {/* Variant List */}
      <div className="space-y-3">
        {variants.map((variant, index) => {
          const isLowStock = variant.stock > 0 && variant.stock <= 5;
          const isOutOfStock = variant.stock === 0;

          return (
            <div
              key={`${variant.size}-${variant.color}`}
              className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                isOutOfStock
                  ? 'border-bmr-acc-red bg-bmr-acc-red/5'
                  : isLowStock
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-line bg-surface-2'
              }`}
            >
              {/* Variant Info */}
              <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-xs text-bmr-muted uppercase tracking-wide block mb-1">Size</label>
                  <p className="font-medium text-lg">{variant.size}</p>
                </div>
                <div>
                  <label className="text-xs text-bmr-muted uppercase tracking-wide block mb-1">Color</label>
                  <p className="font-medium text-lg">{variant.color}</p>
                </div>
                <div>
                  <label className="text-xs text-bmr-muted uppercase tracking-wide block mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateStock(variant.size, variant.color, value);
                    }}
                    className={`w-24 px-3 py-2 border rounded font-medium text-lg focus:outline-none focus:ring-2 transition-colors ${
                      isOutOfStock
                        ? 'border-bmr-acc-red focus:ring-bmr-acc-red'
                        : isLowStock
                        ? 'border-yellow-500 focus:ring-yellow-500'
                        : 'border-line focus:ring-bmr-ink'
                    }`}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3 min-w-[120px]">
                {isOutOfStock && (
                  <span className="px-3 py-1 text-xs font-medium text-bmr-acc-red bg-bmr-acc-red/10 rounded-full whitespace-nowrap">
                    Out of Stock
                  </span>
                )}
                {isLowStock && (
                  <span className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full whitespace-nowrap">
                    Low Stock
                  </span>
                )}
                {!isOutOfStock && !isLowStock && (
                  <span className="px-3 py-1 text-xs font-medium text-bmr-acc-green bg-bmr-acc-green/10 rounded-full whitespace-nowrap">
                    In Stock
                  </span>
                )}
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => deleteVariant(variant.size, variant.color)}
                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-400 rounded-lg transition-all flex-shrink-0"
                title={`Delete ${variant.size} - ${variant.color}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}
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
          variants as needed. Click the trash icon to permanently delete a variant.
        </p>
      </div>
    </div>
  );
}


