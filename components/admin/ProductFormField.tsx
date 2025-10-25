'use client';

import { forwardRef } from 'react';

interface ProductFormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'url';
  required?: boolean;
  error?: string;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

export const ProductFormField = forwardRef<HTMLInputElement, ProductFormFieldProps>(
  ({ label, name, type = 'text', required = false, error, placeholder, min, max, step, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium">
          {label}
          {required && <span className="text-bmr-acc-red ml-1">*</span>}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          ref={ref}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            error
              ? 'border-bmr-acc-red focus:ring-bmr-acc-red'
              : 'border-line focus:ring-bmr-ink'
          }`}
          {...props}
        />
        {error && <p className="text-sm text-bmr-acc-red">{error}</p>}
      </div>
    );
  }
);

ProductFormField.displayName = 'ProductFormField';


