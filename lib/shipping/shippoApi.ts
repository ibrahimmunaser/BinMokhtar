/**
 * Shippo API Client
 * Centralized API request handler with authentication
 */

const SHIPPO_API_URL = 'https://api.goshippo.com';

/**
 * Get Shippo API token from environment
 * Supports both SHIPPO_API_KEY (new) and SHIPPO_API_TOKEN (legacy)
 * 
 * PRODUCTION SAFETY: This function validates that test keys are never used in production
 */
function getShippoToken(): string {
  // Prefer SHIPPO_API_KEY (new standard), fallback to SHIPPO_API_TOKEN (legacy)
  const token = process.env.SHIPPO_API_KEY || process.env.SHIPPO_API_TOKEN;
  if (!token) {
    throw new Error('SHIPPO_API_KEY or SHIPPO_API_TOKEN is not configured');
  }
  
  // 🚨 PRODUCTION SAFETY CHECK #1: Detect test key prefix
  const tokenPrefix = token.substring(0, 12); // 'shippo_test_' or 'shippo_live_'
  const isTestKey = token.startsWith('shippo_test_');
  const isLiveKey = token.startsWith('shippo_live_');
  
  // Log first 6 characters for debugging (never log full key)
  console.log('📦 Shippo token prefix (first 12 chars):', tokenPrefix);
  console.log('📦 Is test key:', isTestKey);
  console.log('📦 Is live key:', isLiveKey);
  
  // 🚨 PRODUCTION SAFETY CHECK #2: Check SHIPPO_USE_TEST override
  const useTestEnv = process.env.SHIPPO_USE_TEST === 'true';
  if (useTestEnv) {
    console.warn('⚠️ SHIPPO_USE_TEST=true detected - forcing TEST mode');
  }
  
  // 🚨 PRODUCTION SAFETY CHECK #3: Fail hard in production if test key detected
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.VERCEL_ENV === 'production' ||
                       process.env.RENDER === 'true'; // Render sets this
  
  if (isProduction && (isTestKey || useTestEnv)) {
    console.error('🚨 CRITICAL: Test Shippo key or SHIPPO_USE_TEST=true detected in PRODUCTION');
    console.error('🚨 Token prefix:', tokenPrefix);
    console.error('🚨 SHIPPO_USE_TEST:', useTestEnv);
    console.error('🚨 NODE_ENV:', process.env.NODE_ENV);
    console.error('🚨 VERCEL_ENV:', process.env.VERCEL_ENV);
    console.error('🚨 RENDER:', process.env.RENDER);
    
    throw new Error(
      'CRITICAL SECURITY ERROR: Shippo test key or SHIPPO_USE_TEST=true detected in production environment. ' +
      'This would create SAMPLE labels instead of real shipping labels. ' +
      'Please update SHIPPO_API_TOKEN to a live key (shippo_live_...) and ensure SHIPPO_USE_TEST is not set.'
    );
  }
  
  // 🚨 PRODUCTION SAFETY CHECK #4: Warn if unrecognized key format
  if (!isTestKey && !isLiveKey) {
    console.warn('⚠️ WARNING: Shippo token does not match expected format');
    console.warn('⚠️ Expected: shippo_test_... or shippo_live_...');
    console.warn('⚠️ Got prefix:', tokenPrefix);
  }
  
  // Log which mode we're using
  if (useTestEnv || isTestKey) {
    console.log('📦 🧪 Using Shippo TEST mode - Labels will be SAMPLE');
  } else if (isLiveKey) {
    console.log('📦 ✅ Using Shippo LIVE mode - Labels will be REAL');
  } else {
    console.log('📦 ⚠️ Using Shippo (unknown mode) - prefix:', tokenPrefix);
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

  // Log transaction responses in detail to debug label URL issues
  if (endpoint.includes('/transactions')) {
    console.log('📦 SHIPPO TRANSACTION RESPONSE:');
    console.log('📦 - Endpoint:', endpoint);
    console.log('📦 - Status:', response.status);
    console.log('📦 - Transaction status:', data.status);
    console.log('📦 - object_id:', data.object_id);
    console.log('📦 - label_url:', data.label_url);
    console.log('📦 - tracking_number:', data.tracking_number);
    console.log('📦 - tracking_url_provider:', data.tracking_url_provider);
    console.log('📦 - All keys:', Object.keys(data));
    console.log('📦 - Full response:', JSON.stringify(data, null, 2));
  }

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



