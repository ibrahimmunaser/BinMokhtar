'use client';

import { useState, FormEvent } from 'react';
import { FormDisclaimer } from './FormDisclaimer';

/**
 * PharmacyFormBase Component
 * 
 * Handles form submission, loading states, success/error UX.
 * Uses fetch with URLSearchParams to avoid CORS preflight.
 */

interface PharmacyFormBaseProps {
  formType: 'refill' | 'transfer';
  children: React.ReactNode;
  onSubmit: (formData: FormData) => Promise<void>;
  formId: string;
}

export function PharmacyFormBase({ 
  formType, 
  children, 
  onSubmit, 
  formId 
}: PharmacyFormBaseProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setShowSuccess(false);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(formData);
      
      // Success - reset form but keep patient name for convenience
      setShowSuccess(true);
      const form = e.currentTarget;
      const patientName = formData.get('patientName');
      form.reset();
      
      // Restore patient name
      if (patientName) {
        const nameInput = form.querySelector<HTMLInputElement>('[name="patientName"]');
        if (nameInput) {
          nameInput.value = patientName as string;
        }
      }
      
      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Panel */}
      {showSuccess && (
        <div 
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Request Submitted Successfully
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Thanks — your request was sent to the pharmacy. We may contact you 
                  at the phone number provided.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              aria-label="Dismiss success message"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Panel */}
      {error && (
        <div 
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">
                  Submission Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {error}
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                  Please try again or call the pharmacy at{' '}
                  <a 
                    href="tel:+13135551234" 
                    className="underline font-medium hover:text-red-900 dark:hover:text-red-300"
                  >
                    (313) 555-1234
                  </a>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              aria-label="Dismiss error message"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form 
        id={formId}
        onSubmit={handleSubmit}
        method="POST"
        className="space-y-6"
        noValidate
      >
        {children}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              `Submit ${formType === 'refill' ? 'Refill' : 'Transfer'} Request`
            )}
          </button>
        </div>

        {/* Privacy Disclaimer */}
        <FormDisclaimer />
      </form>
    </div>
  );
}

