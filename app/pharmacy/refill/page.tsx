'use client';

import { useState, useEffect } from 'react';
import { PharmacyFormBase } from '@/components/pharmacy/PharmacyFormBase';
import { FormInput } from '@/components/pharmacy/FormInput';
import { getPharmacyFormEndpoint } from '@/lib/pharmacy-form-config';
import { 
  normalizePhone, 
  normalizeDate, 
  isDuplicateSubmission,
  sharedFormSchema 
} from '@/lib/pharmacy-form-validation';

/**
 * Refill Request Page
 * 
 * Allows patients to request prescription refills from the pharmacy.
 */

export default function RefillPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [charCounts, setCharCounts] = useState({ medications: 0, notes: 0 });

  useEffect(() => {
    // Set page title
    document.title = 'Prescription Refill Request | Xpress Care Pharmacy';
  }, []);

  const handleSubmit = async (formData: FormData) => {
    // Clear previous errors
    setErrors({});

    // Prepare data object
    const data = {
      patientName: (formData.get('patientName') as string || '').trim(),
      dob: normalizeDate(formData.get('dob') as string || ''),
      phone: (formData.get('phone') as string || '').trim(),
      email: (formData.get('email') as string || '').trim(),
      medications: (formData.get('medications') as string || '').trim(),
      rxNumber: (formData.get('rxNumber') as string || '').trim(),
      notes: (formData.get('notes') as string || '').trim(),
      type: 'refill' as const,
      website: formData.get('website') as string || '',
      ts: new Date().toISOString(),
    };

    // Validate with Zod
    const result = sharedFormSchema.safeParse(data);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      
      // Focus first error field
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
        element?.focus();
      }
      
      throw new Error('Please check the form for errors and try again.');
    }

    // Client deduplication check
    if (isDuplicateSubmission(data)) {
      const confirmed = window.confirm(
        'It looks like you may have already submitted this request recently. ' +
        'Do you want to submit it again?'
      );
      if (!confirmed) {
        throw new Error('Submission cancelled - duplicate detected.');
      }
    }

    // Normalize phone for submission
    const submissionData = {
      ...data,
      phone: normalizePhone(data.phone),
    };

    // Get endpoint
    const endpoint = await getPharmacyFormEndpoint();

    // Submit via fetch with URLSearchParams (avoids CORS preflight)
    const params = new URLSearchParams();
    Object.entries(submissionData).forEach(([key, value]) => {
      params.append(key, String(value));
    });

    // Log submission in development
    if (process.env.NODE_ENV === 'development') {
      console.info('Refill form submission:', {
        submission_id: submissionData.ts,
        ts: submissionData.ts,
        status: 'sending',
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseData = await response.json();

    if (process.env.NODE_ENV === 'development') {
      console.info('Refill form response:', {
        submission_id: submissionData.ts,
        ts: submissionData.ts,
        status: responseData.ok ? 'ok' : 'error',
      });
    }

    if (!responseData.ok) {
      if (responseData.error === 'rate_limited') {
        throw new Error(
          'Too many requests. Please wait a few minutes before trying again.'
        );
      }
      throw new Error(
        responseData.error || 'We couldn\'t send your request. Please try again.'
      );
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const name = target.name;
    const value = target.value;
    
    if (name === 'medications' || name === 'notes') {
      setCharCounts(prev => ({ ...prev, [name]: value.length }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    const name = e.currentTarget.name;
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Prescription Refill Request
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Submit your refill request and we'll get back to you soon.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
          <PharmacyFormBase 
            formType="refill" 
            onSubmit={handleSubmit}
            formId="refill-form"
          >
            {/* Honeypot field - hidden from users, should remain empty */}
            <FormInput
              type="hidden"
              name="website"
              label=""
              tabIndex={-1}
              autoComplete="off"
            />

            <FormInput
              label="Patient Name"
              name="patientName"
              type="text"
              required
              error={errors.patientName}
              maxLength={100}
              autoComplete="name"
              onChange={handleInputChange}
            />

            <FormInput
              label="Date of Birth"
              name="dob"
              type="date"
              required
              error={errors.dob}
              autoComplete="bday"
              onChange={handleInputChange}
            />

            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              required
              error={errors.phone}
              maxLength={17}
              placeholder="(313) 555-1234"
              autoComplete="tel"
              onChange={handleInputChange}
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              error={errors.email}
              maxLength={120}
              placeholder="patient@example.com"
              autoComplete="email"
              helpText="Optional - we'll use this for the reply-to address"
              onChange={handleInputChange}
            />

            <div className="space-y-1">
              <FormInput
                label="Medications to Refill"
                name="medications"
                type="textarea"
                required
                error={errors.medications}
                maxLength={1500}
                rows={4}
                placeholder="List medications (comma or line separated)&#10;Example:&#10;Lisinopril 10mg&#10;Metformin 500mg"
                onInput={handleInput}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {charCounts.medications}/1500 characters
              </div>
            </div>

            <FormInput
              label="Rx Number"
              name="rxNumber"
              type="text"
              error={errors.rxNumber}
              maxLength={40}
              placeholder="Optional"
              helpText="If you have your prescription number, include it here"
              onChange={handleInputChange}
            />

            <div className="space-y-1">
              <FormInput
                label="Additional Notes"
                name="notes"
                type="textarea"
                error={errors.notes}
                maxLength={1500}
                rows={3}
                placeholder="Any additional information (optional)"
                onInput={handleInput}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {charCounts.notes}/1500 characters
              </div>
            </div>
          </PharmacyFormBase>
        </div>

        {/* Non-JS Fallback */}
        <noscript>
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              JavaScript is disabled. The form will still work, but you'll be redirected 
              after submission. For the best experience, please enable JavaScript.
            </p>
          </div>
        </noscript>
      </div>
    </main>
  );
}

