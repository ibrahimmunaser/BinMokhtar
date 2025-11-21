'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Variant {
  size: string;
  color: string;
  stock: number;
  sku: string; // Required
  barcode?: string; // Optional
  price?: number; // Optional per-variant price override
  salePrice?: number; // Optional per-variant sale price
}

interface VariantStockMatrixProps {
  sizes: string[];
  colors: string[];
  value: Variant[];
  onChange: (variants: Variant[]) => void;
  basePrice?: number; // Product's base price for default
  baseSalePrice?: number; // Product's base sale price for default
}

export function VariantStockMatrix({ sizes, colors, value, onChange, basePrice, baseSalePrice }: VariantStockMatrixProps) {
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
          // Create new variant with default values
          newVariants.push({
            size,
            color,
            stock: 0,
            sku: `${size}-${color}-${Date.now()}`.toUpperCase().replace(/\s+/g, '-'),
            barcode: '',
            price: basePrice, // Default to product price
            salePrice: baseSalePrice, // Default to product sale price
          });
        }
      }
    }

    setVariants(newVariants);
    onChange(newVariants);
  }, [sizes, colors]);

  const updateVariantField = (size: string, color: string, field: keyof Variant, value: any) => {
    const updatedVariants = variants.map(v => {
      if (v.size === size && v.color === color) {
        return { ...v, [field]: value };
      }
      return v;
    });
    
    setVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const updateStock = (size: string, color: string, stock: number) => {
    updateVariantField(size, color, 'stock', Math.max(0, stock));
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

      {/* Variant Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-3 border-b border-line">
              <th className="px-3 py-3 text-left text-xs font-medium text-bmr-muted uppercase tracking-wide">Size</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-bmr-muted uppercase tracking-wide">Color</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-bmr-muted uppercase tracking-wide">SKU <span className="text-bmr-acc-red">*</span></th>
              <th className="px-3 py-3 text-left text-xs font-medium text-bmr-muted uppercase tracking-wide">Barcode</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-bmr-muted uppercase tracking-wide">Price</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-bmr-muted uppercase tracking-wide">Sale Price</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-bmr-muted uppercase tracking-wide">Stock <span className="text-bmr-acc-red">*</span></th>
              <th className="px-3 py-3 text-center text-xs font-medium text-bmr-muted uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-surface-2">
            {variants.map((variant, index) => {
              const isLowStock = variant.stock > 0 && variant.stock <= 5;
              const isOutOfStock = variant.stock === 0;
              const hasSkuError = !variant.sku || variant.sku.trim() === '';

              return (
                <tr
                  key={`${variant.size}-${variant.color}-${index}`}
                  className={`border-b border-line ${
                    isOutOfStock ? 'bg-bmr-acc-red/5' : isLowStock ? 'bg-yellow-50/50' : ''
                  }`}
                >
                  {/* Size */}
                  <td className="px-3 py-3 font-medium">{variant.size}</td>
                  
                  {/* Color */}
                  <td className="px-3 py-3 font-medium">{variant.color}</td>
                  
                  {/* SKU - Required */}
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariantField(variant.size, variant.color, 'sku', e.target.value)}
                      placeholder="Required"
                      required
                      className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
                        hasSkuError
                          ? 'border-bmr-acc-red focus:ring-bmr-acc-red bg-bmr-acc-red/5'
                          : 'border-line focus:ring-bmr-ink'
                      }`}
                    />
                  </td>
                  
                  {/* Barcode - Optional */}
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={variant.barcode || ''}
                      onChange={(e) => updateVariantField(variant.size, variant.color, 'barcode', e.target.value)}
                      placeholder="Optional"
                      className="w-full px-2 py-1.5 text-sm border border-line rounded focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                    />
                  </td>
                  
                  {/* Price - Optional override */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-bmr-muted">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price !== undefined ? variant.price : ''}
                        onChange={(e) => updateVariantField(variant.size, variant.color, 'price', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder={basePrice?.toString() || 'Base'}
                        className="w-20 px-2 py-1.5 text-sm border border-line rounded focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                      />
                    </div>
                  </td>
                  
                  {/* Sale Price - Optional */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-bmr-muted">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.salePrice !== undefined ? variant.salePrice : ''}
                        onChange={(e) => updateVariantField(variant.size, variant.color, 'salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder={baseSalePrice?.toString() || '—'}
                        className="w-20 px-2 py-1.5 text-sm border border-line rounded focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                      />
                    </div>
                  </td>
                  
                  {/* Stock */}
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        updateStock(variant.size, variant.color, value);
                      }}
                      className={`w-20 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
                        isOutOfStock
                          ? 'border-bmr-acc-red focus:ring-bmr-acc-red'
                          : isLowStock
                          ? 'border-yellow-500 focus:ring-yellow-500'
                          : 'border-line focus:ring-bmr-ink'
                      }`}
                    />
                  </td>
                  
                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => deleteVariant(variant.size, variant.color)}
                      className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-400 rounded transition-all"
                      title={`Delete ${variant.size} - ${variant.color}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
        <p className="text-sm text-blue-900">
          💡 <strong>Tips:</strong>
        </p>
        <ul className="text-sm text-blue-900 space-y-1 ml-4 list-disc">
          <li><strong>SKU is required</strong> for each variant and must be unique across all products.</li>
          <li><strong>Price</strong> and <strong>Sale Price</strong> default to the product's base price but can be overridden per variant.</li>
          <li>Leave Price/Sale Price empty to use the product's default pricing.</li>
          <li>Use "Quick Set All" to bulk-set stock levels, then adjust individual variants.</li>
          <li>Click the trash icon to permanently delete a variant.</li>
        </ul>
      </div>
    </div>
  );
}


