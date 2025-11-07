/**
 * FormDisclaimer Component
 * 
 * Privacy notice for pharmacy forms. Abstracted to a component
 * so it can be easily updated if the pharmacy upgrades to a
 * HIPAA-compliant email solution.
 */

export function FormDisclaimer() {
  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <p>
        <strong>Privacy Notice:</strong> By submitting this form, you consent to us 
        contacting you about your request. This form uses email, which may not be 
        HIPAA-compliant. Please avoid entering unnecessary sensitive details.
      </p>
      <p>
        For sensitive health information, please contact the pharmacy directly at{' '}
        <a 
          href="tel:+13135551234" 
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          (313) 555-1234
        </a>.
      </p>
    </div>
  );
}

