import { z } from 'zod';

/**
 * Pharmacy Form Validation Schemas
 * 
 * Shared validation logic for Refill and Transfer forms.
 * Enforces field requirements, formats, and length limits.
 */

// Phone validation: accepts various formats, will be normalized to digits only
const phoneRegex = /^[\d\s\-\(\)\+\.]{10,17}$/;

// Email validation: RFC-like pattern
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared fields for both forms
export const sharedFormSchema = z.object({
  patientName: z.string()
    .min(2, 'Patient name must be at least 2 characters')
    .max(100, 'Patient name cannot exceed 100 characters')
    .trim(),
  
  dob: z.string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(17, 'Phone number cannot exceed 17 characters')
    .regex(phoneRegex, 'Please enter a valid phone number'),
  
  email: z.string()
    .min(5, 'Email must be at least 5 characters')
    .max(120, 'Email cannot exceed 120 characters')
    .regex(emailRegex, 'Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  
  medications: z.string()
    .min(1, 'Please list your medications')
    .max(1500, 'Medications list cannot exceed 1500 characters')
    .trim(),
  
  rxNumber: z.string()
    .max(40, 'Rx number cannot exceed 40 characters')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(1500, 'Notes cannot exceed 1500 characters')
    .optional()
    .or(z.literal('')),
  
  type: z.enum(['refill', 'transfer']),
  
  // Honeypot - must be empty
  website: z.string().max(0, 'Invalid submission'),
  
  // Timestamp - auto-filled by client
  ts: z.string(),
});

// Transfer form adds two additional required fields
export const transferFormSchema = sharedFormSchema.extend({
  fromPharmacy: z.string()
    .min(2, 'Pharmacy name must be at least 2 characters')
    .max(120, 'Pharmacy name cannot exceed 120 characters')
    .trim(),
  
  fromPharmacyPhone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(17, 'Phone number cannot exceed 17 characters')
    .regex(phoneRegex, 'Please enter a valid phone number'),
});

export type RefillFormData = z.infer<typeof sharedFormSchema>;
export type TransferFormData = z.infer<typeof transferFormSchema>;

/**
 * Normalizes phone number to digits only (keeps leading + if present)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Check if starts with +
  const hasPlus = phone.trim().startsWith('+');
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Formats date to YYYY-MM-DD if it's not already
 */
export function normalizeDate(date: string): string {
  if (!date) return '';
  
  // Already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Try to parse and format
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Invalid date, return as-is
  }
  
  return date;
}

/**
 * Client-side deduplication to prevent accidental double-submissions
 * Returns true if this is likely a duplicate submission
 */
export function isDuplicateSubmission(formData: {
  patientName: string;
  dob: string;
  phone: string;
  type: string;
  medications: string;
}): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    // Create a hash-like key
    const hourBucket = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const key = `${formData.patientName}|${formData.dob}|${formData.phone}|${formData.type}|${formData.medications.slice(0, 50)}|${hourBucket}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const hashStr = `pharmacy_form_${Math.abs(hash)}`;
    
    // Check if this hash was submitted recently
    const lastSubmit = localStorage.getItem(hashStr);
    const now = Date.now();
    
    if (lastSubmit) {
      const lastTime = parseInt(lastSubmit, 10);
      // Consider it a duplicate if within 10 minutes
      if (now - lastTime < 10 * 60 * 1000) {
        return true;
      }
    }
    
    // Store this submission
    localStorage.setItem(hashStr, now.toString());
    
    // Clean up old entries (older than 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith('pharmacy_form_')) {
        const value = localStorage.getItem(storageKey);
        if (value && parseInt(value, 10) < oneHourAgo) {
          localStorage.removeItem(storageKey);
        }
      }
    }
    
    return false;
  } catch (e) {
    // If localStorage fails, allow submission
    console.error('Deduplication check failed:', e);
    return false;
  }
}

