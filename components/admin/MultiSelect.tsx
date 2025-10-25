'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  options: string[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
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
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-bmr-acc-red ml-1">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 border rounded-lg text-left focus:outline-none focus:ring-2 transition-colors ${
            error
              ? 'border-bmr-acc-red focus:ring-bmr-acc-red'
              : 'border-line focus:ring-bmr-ink'
          }`}
        >
          {value.length > 0 ? (
            <span className="flex flex-wrap gap-2">
              {value.map((v) => (
                <span key={v} className="px-2 py-1 bg-bmr-ink text-surface-2 text-sm rounded">
                  {v}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-bmr-muted">{placeholder}</span>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-surface-2 border border-line rounded-lg shadow-lg max-h-60 overflow-auto">
              {options.map((option) => {
                const isSelected = value.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className={`w-full px-4 py-3 text-left hover:bg-surface-3 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-surface-3' : ''
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check className="w-4 h-4 text-bmr-ink" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-bmr-acc-red">{error}</p>}
    </div>
  );
}


