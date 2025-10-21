'use client';

import { useState } from 'react';
import type { FilterState } from '@/types';

interface FilterRailProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: Array<{ id: string; name: string }>;
  availableSizes: string[];
  availableColors: string[];
  availableSleeves?: string[];
}

export function FilterRail({
  filters,
  onChange,
  categories,
  availableSizes,
  availableColors,
  availableSleeves = [],
}: FilterRailProps) {
  const [priceMin, setPriceMin] = useState(filters.priceRange[0]);
  const [priceMax, setPriceMax] = useState(filters.priceRange[1]);

  const toggleCategory = (id: string) => {
    const newCategories = filters.categories.includes(id)
      ? filters.categories.filter((c) => c !== id)
      : [...filters.categories, id];
    onChange({ ...filters, categories: newCategories });
  };

  const toggleSize = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onChange({ ...filters, sizes: newSizes });
  };

  const toggleColor = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onChange({ ...filters, colors: newColors });
  };

  const toggleSleeve = (sleeve: string) => {
    const newSleeves = filters.sleeves.includes(sleeve)
      ? filters.sleeves.filter((s) => s !== sleeve)
      : [...filters.sleeves, sleeve];
    onChange({ ...filters, sleeves: newSleeves });
  };

  const applyPriceRange = () => {
    onChange({ ...filters, priceRange: [priceMin, priceMax] });
  };

  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Category</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="w-4 h-4 border-border"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Size</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 border text-sm ${
                  filters.sizes.includes(size)
                    ? 'border-bmr-black bg-bmr-black text-bmr-white'
                    : 'border-border hover:border-bmr-black'
                } transition-colors`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Color</h3>
          <div className="space-y-2">
            {availableColors.map((color) => (
              <label key={color} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.colors.includes(color)}
                  onChange={() => toggleColor(color)}
                  className="w-4 h-4 border-border"
                />
                <span className="text-sm capitalize">{color}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Sleeve */}
      {availableSleeves.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Sleeve</h3>
          <div className="flex flex-wrap gap-2">
            {availableSleeves.map((sleeve) => (
              <button
                key={sleeve}
                onClick={() => toggleSleeve(sleeve)}
                className={`px-4 py-2 border text-sm capitalize ${
                  filters.sleeves.includes(sleeve)
                    ? 'border-bmr-black bg-bmr-black text-bmr-white'
                    : 'border-border hover:border-bmr-black'
                } transition-colors`}
              >
                {sleeve}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Price Range</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(Number(e.target.value))}
              placeholder="Min"
              className="w-full px-3 py-2 border border-border text-sm"
            />
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              placeholder="Max"
              className="w-full px-3 py-2 border border-border text-sm"
            />
          </div>
          <button
            onClick={applyPriceRange}
            className="w-full px-4 py-2 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Clear All */}
      <button
        onClick={() =>
          onChange({
            categories: [],
            sizes: [],
            colors: [],
            sleeves: [],
            priceRange: [0, 100000],
          })
        }
        className="text-sm text-muted hover:text-bmr-black underline"
      >
        Clear all filters
      </button>
    </div>
  );
}



