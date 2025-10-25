'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagsInputProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagsInput({ label, name, required = false, error, value, onChange }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-bmr-acc-red ml-1">*</span>}
      </label>
      
      <div
        className={`w-full px-4 py-3 border rounded-lg focus-within:ring-2 transition-colors ${
          error
            ? 'border-bmr-acc-red focus-within:ring-bmr-acc-red'
            : 'border-line focus-within:ring-bmr-ink'
        }`}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-bmr-ink text-surface-2 text-sm rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-bmr-fg rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        
        <input
          id={name}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? "Type and press Enter or comma to add tags" : "Add another tag..."}
          className="w-full focus:outline-none bg-transparent"
        />
      </div>
      
      <p className="text-xs text-bmr-muted">Press Enter or comma to add tags. At least 2 required.</p>
      {error && <p className="text-sm text-bmr-acc-red">{error}</p>}
    </div>
  );
}


