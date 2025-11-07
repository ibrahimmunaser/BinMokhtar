/**
 * FormInput Component
 * 
 * Accessible form input with label, validation, and error display.
 */

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & {
  type?: 'text' | 'tel' | 'email' | 'date' | 'hidden';
};

type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & {
  type: 'textarea';
  rows?: number;
};

type FormInputProps = InputProps | TextareaProps;

export function FormInput(props: FormInputProps) {
  const { label, name, error, required, helpText, type = 'text', ...rest } = props;

  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  const helpId = `help-${name}`;

  const baseClasses = 
    'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ' +
    'dark:bg-gray-800 dark:border-gray-700 dark:text-white ' +
    (error 
      ? 'border-red-500 dark:border-red-500' 
      : 'border-gray-300 dark:border-gray-600'
    );

  if (type === 'hidden') {
    return <input type="hidden" name={name} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />;
  }

  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          required={required}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
          className={`${baseClasses} resize-y min-h-[100px]`}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          required={required}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
          className={baseClasses}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {helpText && !error && (
        <p id={helpId} className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

