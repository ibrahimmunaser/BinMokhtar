'use client';

import { useState, useEffect } from 'react';
import type { FilterState } from '@/types';

// Main categories (collections)
const MAIN_CATEGORIES = [
  { id: 'men', name: 'Men' },
  { id: 'boys', name: 'Boys' },
  { id: 'shemaghs', name: 'Shemaghs' },
];

// Fallback subcategories (shown only if Firebase returns empty)
const FALLBACK_SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  men: [
    { id: 'emirati', name: 'Emirati Thobes' },
    { id: 'saudi', name: 'Saudi Thobes' },
  ],
  boys: [
    { id: 'thobes', name: 'Emirati Thobes' },
  ],
  shemaghs: [
    { id: 'traditional', name: 'Traditional' },
    { id: 'yemeni', name: 'Yemeni' },
  ],
};

interface SubcategoryData {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  active: boolean;
}

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
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  
  // Dynamic subcategories from Firebase
  const [allSubcategories, setAllSubcategories] = useState<SubcategoryData[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(true);

  // Fetch subcategories on mount
  useEffect(() => {
    const fetchSubcategories = async () => {
      setIsLoadingSubcategories(true);
      try {
        const response = await fetch('/api/admin/subcategories');
        const data = await response.json();
        if (data.success) {
          setAllSubcategories(data.subcategories || []);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setIsLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, []);

  const toggleMainCategory = (id: string) => {
    const newSelected = selectedMainCategories.includes(id)
      ? selectedMainCategories.filter((c) => c !== id)
      : [...selectedMainCategories, id];
    setSelectedMainCategories(newSelected);
    
    // Update the filter with the category ID for filtering
    onChange({ ...filters, categories: newSelected as any });
  };

  const toggleSubcategory = (subcategory: string) => {
    const currentSubcategories = filters.subcategories || [];
    const newSubcategories = currentSubcategories.includes(subcategory)
      ? currentSubcategories.filter((s) => s !== subcategory)
      : [...currentSubcategories, subcategory];
    onChange({ ...filters, subcategories: newSubcategories });
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
    const currentSleeves = filters.sleeves || [];
    const newSleeves = currentSleeves.includes(sleeve)
      ? currentSleeves.filter((s) => s !== sleeve)
      : [...currentSleeves, sleeve];
    onChange({ ...filters, sleeves: newSleeves });
  };

  const applyPriceRange = () => {
    onChange({ ...filters, priceRange: [priceMin, priceMax] });
  };

  // Map category IDs to parent category IDs (normalize case)
  const getCategoryParentId = (categoryId: string): string => {
    const normalizedId = categoryId.toLowerCase();
    // Map lowercase category IDs to proper case for parent matching
    const mappings: Record<string, string> = {
      'men': 'Men',
      'boys': 'Boys',
      'shemaghs': 'Shemaghs',
      'women': 'Women',
      'girls': 'Girls',
    };
    return mappings[normalizedId] || categoryId;
  };

  // Get subcategories only for selected main categories (from Firebase, with fallback)
  const availableSubcategories = selectedMainCategories.length > 0
    ? selectedMainCategories.flatMap(catId => {
        const catIdLower = catId.toLowerCase();
        const parentId = getCategoryParentId(catId);
        
        // Get subcategories from Firebase
        const firebaseSubs = allSubcategories
          .filter(sub => sub.parentCategoryId === parentId && sub.active !== false)
          .map(sub => ({
            id: sub.slug,
            name: sub.name,
          }));
        
        // If Firebase has data, use it; otherwise fall back to defaults
        if (firebaseSubs.length > 0) {
          return firebaseSubs;
        }
        
        return FALLBACK_SUBCATEGORIES[catIdLower] || [];
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Main Categories */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Category</h3>
        <div className="space-y-2">
          {MAIN_CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMainCategories.includes(cat.id)}
                onChange={() => toggleMainCategory(cat.id)}
                className="w-4 h-4 border-border"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategories / Style - Now dynamic from Firebase */}
      {selectedMainCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Style</h3>
          {isLoadingSubcategories ? (
            <p className="text-sm text-bmr-muted">Loading styles...</p>
          ) : availableSubcategories.length > 0 ? (
            <div className="space-y-2">
              {availableSubcategories.map((sub) => (
                <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.subcategories?.includes(sub.id) || false}
                    onChange={() => toggleSubcategory(sub.id)}
                    className="w-4 h-4 border-border"
                  />
                  <span className="text-sm">{sub.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-bmr-muted">No styles available for selected categories</p>
          )}
        </div>
      )}

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wideish mb-4">Size</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 border text-sm rounded transition-colors ${
                  filters.sizes.includes(size)
                    ? 'border-bmr-ink bg-bmr-ink text-white'
                    : 'border-line hover:border-bmr-ink'
                }`}
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
                className={`px-4 py-2 border text-sm capitalize rounded transition-colors ${
                  filters.sleeves?.includes(sleeve)
                    ? 'border-bmr-ink bg-bmr-ink text-white'
                    : 'border-line hover:border-bmr-ink'
                }`}
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
        onClick={() => {
          setSelectedMainCategories([]);
          onChange({
            categories: [],
            subcategories: [],
            sizes: [],
            colors: [],
            sleeves: [],
            priceRange: [0, 100000],
          });
        }}
        className="text-sm text-muted hover:text-bmr-black underline"
      >
        Clear all filters
      </button>
    </div>
  );
}
