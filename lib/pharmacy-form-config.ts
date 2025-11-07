/**
 * Pharmacy Form Configuration
 * 
 * Fetches the Google Apps Script endpoint URL from environment variables
 * or config file. Provides clear error messages when not configured.
 */

let cachedEndpoint: string | null = null;

export async function getPharmacyFormEndpoint(): Promise<string> {
  // Check cache first
  if (cachedEndpoint) {
    return cachedEndpoint;
  }

  // Try environment variable first (server or client)
  const envEndpoint = process.env.NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT;
  
  if (envEndpoint && envEndpoint.trim()) {
    cachedEndpoint = envEndpoint.trim();
    return cachedEndpoint;
  }

  // Fall back to config file
  try {
    const response = await fetch('/config/form-endpoint.json');
    if (response.ok) {
      const config = await response.json();
      if (config.pharmacyFormEndpoint && config.pharmacyFormEndpoint.trim()) {
        cachedEndpoint = config.pharmacyFormEndpoint.trim();
        return cachedEndpoint;
      }
    }
  } catch (error) {
    console.error('Failed to load form endpoint from config file:', error);
  }

  // No endpoint configured
  throw new Error(
    'Pharmacy form endpoint not configured. ' +
    'Please set NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT in .env.local or ' +
    'update config/form-endpoint.json. See config/README.md for details.'
  );
}

/**
 * Client-side version that can be used synchronously if env var is set
 */
export function getPharmacyFormEndpointSync(): string | null {
  if (cachedEndpoint) {
    return cachedEndpoint;
  }

  const envEndpoint = process.env.NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT;
  if (envEndpoint && envEndpoint.trim()) {
    cachedEndpoint = envEndpoint.trim();
    return cachedEndpoint;
  }

  return null;
}

