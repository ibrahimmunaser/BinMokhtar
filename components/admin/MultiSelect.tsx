'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  options: string[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean; // Allow adding custom values
  customPlaceholder?: string; // Placeholder for custom input
}

export function MultiSelect({
  label,
  name,
  required = false,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select options',
  allowCustom = true, // Default to allowing custom entries
  customPlaceholder = 'Type to add custom...',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const addCustomValue = () => {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomValue();
    }
  };

  const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== valueToRemove));
  };

  // Combine predefined options with any custom values that were added
  const allOptions = [...new Set([...options, ...value])];

  return (
    <div className="space-y-2" ref={containerRef}>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-bmr-acc-red ml-1">*</span>}
      </label>

      <div className="relative">
        {/* Selected values display / trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 border rounded-lg text-left focus:outline-none focus:ring-2 transition-colors min-h-[50px] ${
            error
              ? 'border-bmr-acc-red focus:ring-bmr-acc-red'
              : 'border-line focus:ring-bmr-ink'
          }`}
        >
          {value.length > 0 ? (
            <span className="flex flex-wrap gap-2">
              {value.map((v) => (
                <span 
                  key={v} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-bmr-ink text-surface-2 text-sm rounded group"
                >
                  {v}
                  <button
                    type="button"
                    onClick={(e) => removeValue(v, e)}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </span>
          ) : (
            <span className="text-bmr-muted">{placeholder}</span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-surface-2 border border-line rounded-lg shadow-lg overflow-hidden">
            {/* Custom input */}
            {allowCustom && (
              <div className="p-2 border-b border-line bg-surface-3">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={customPlaceholder}
                    className="flex-1 px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:border-bmr-ink"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={addCustomValue}
                    disabled={!customInput.trim()}
                    className="px-3 py-2 bg-bmr-ink text-surface-2 rounded-lg text-sm hover:bg-bmr-ink/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                <p className="text-xs text-bmr-muted mt-1">
                  Press Enter or click Add to include a custom value
                </p>
              </div>
            )}

            {/* Predefined options */}
            <div className="max-h-48 overflow-auto">
              {allOptions.length > 0 ? (
                allOptions.map((option) => {
                  const isSelected = value.includes(option);
                  const isCustom = !options.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleOption(option)}
                      className={`w-full px-4 py-3 text-left hover:bg-surface-3 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-surface-3' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {option}
                        {isCustom && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            custom
                          </span>
                        )}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-bmr-ink" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-bmr-muted">
                  No predefined options. Add custom values above.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      {allowCustom && !isOpen && (
        <p className="text-xs text-bmr-muted">
          Click to select from common options or add your own
        </p>
      )}

      {error && <p className="text-sm text-bmr-acc-red">{error}</p>}
    </div>
  );
}
