'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ColorImageMapping {
  color: string;
  imageUrls: string[];
}

interface ColorImageMapperProps {
  colors: string[];
  images: string[];
  value: ColorImageMapping[];
  onChange: (mappings: ColorImageMapping[]) => void;
}

export function ColorImageMapper({ colors, images, value, onChange }: ColorImageMapperProps) {
  const [mappings, setMappings] = useState<ColorImageMapping[]>(value);

  // Initialize mappings when colors change
  useEffect(() => {
    const newMappings: ColorImageMapping[] = [];
    
    for (const color of colors) {
      const existing = mappings.find(m => m.color === color);
      
      if (existing) {
        newMappings.push(existing);
      } else {
        newMappings.push({
          color,
          imageUrls: [],
        });
      }
    }

    setMappings(newMappings);
    onChange(newMappings);
  }, [colors]);

  const toggleImageForColor = (color: string, imageUrl: string) => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.color === color) {
        const hasImage = mapping.imageUrls.includes(imageUrl);
        
        if (hasImage) {
          // Remove image
          return {
            ...mapping,
            imageUrls: mapping.imageUrls.filter(url => url !== imageUrl),
          };
        } else {
          // Add image
          return {
            ...mapping,
            imageUrls: [...mapping.imageUrls, imageUrl],
          };
        }
      }
      return mapping;
    });

    setMappings(updatedMappings);
    onChange(updatedMappings);
  };

  const isImageSelected = (color: string, imageUrl: string): boolean => {
    const mapping = mappings.find(m => m.color === color);
    return mapping?.imageUrls.includes(imageUrl) ?? false;
  };

  if (colors.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-line rounded-lg text-center">
        <p className="text-bmr-muted mb-2">No colors to configure</p>
        <p className="text-sm text-bmr-muted">
          Please select at least one color to link images
        </p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-line rounded-lg text-center">
        <p className="text-bmr-muted mb-2">No images uploaded</p>
        <p className="text-sm text-bmr-muted">
          Please upload product images first to link them to colors
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-medium">Color to Image Mapping</h3>
        <p className="text-sm text-bmr-muted">
          Select which images represent each color variant
        </p>
      </div>

      {/* Color Mapping List */}
      <div className="space-y-4">
        {mappings.map((mapping) => (
          <div
            key={mapping.color}
            className="p-4 border border-line rounded-lg bg-surface-2"
          >
            {/* Color Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-lg">{mapping.color}</h4>
                <p className="text-sm text-bmr-muted">
                  {mapping.imageUrls.length} {mapping.imageUrls.length === 1 ? 'image' : 'images'} selected
                </p>
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((imageUrl, index) => {
                const isSelected = isImageSelected(mapping.color, imageUrl);
                
                return (
                  <button
                    key={`${mapping.color}-${imageUrl}-${index}`}
                    type="button"
                    onClick={() => toggleImageForColor(mapping.color, imageUrl)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-bmr-ink ring-2 ring-bmr-ink ring-offset-2'
                        : 'border-line hover:border-bmr-muted'
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Selected Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-bmr-ink/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-bmr-ink flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Image Number Badge */}
                    <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Helper Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Click on images to select them for each color variant. 
          You can select multiple images per color. Selected images will show when customers 
          filter products by color on your store.
        </p>
      </div>
    </div>
  );
}

