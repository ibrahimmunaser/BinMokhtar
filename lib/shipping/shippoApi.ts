/**
 * Shippo API Client
 * Centralized API request handler with authentication
 */

const SHIPPO_API_URL = 'https://api.goshippo.com';

/**
 * Get Shippo API token from environment
 * Supports both SHIPPO_API_KEY (new) and SHIPPO_API_TOKEN (legacy)
 */
function getShippoToken(): string {
  // Prefer SHIPPO_API_KEY (new standard), fallback to SHIPPO_API_TOKEN (legacy)
  const token = process.env.SHIPPO_API_KEY || process.env.SHIPPO_API_TOKEN;
  if (!token) {
    throw new Error('SHIPPO_API_KEY or SHIPPO_API_TOKEN is not configured');
  }
  
  // Log which mode we're using (test vs live)
  const useTest = process.env.SHIPPO_USE_TEST === 'true';
  if (useTest) {
    console.log('📦 Using Shippo TEST mode');
  } else {
    console.log('📦 Using Shippo LIVE mode');
  }
  
  return token;
}

/**
 * Make authenticated request to Shippo API
 */
export async function shippoRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getShippoToken();
  
  const url = `${SHIPPO_API_URL}${endpoint}`;
  
  console.log('📦 Shippo API request:', options.method || 'GET', endpoint);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `ShippoToken ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Shippo API error:', {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    
    const errorMessage = data.detail || 
                        data.message || 
                        data.error?.message ||
                        `Shippo API request failed: ${response.status} ${response.statusText}`;
    
    throw new Error(errorMessage);
  }

  return data;
}



