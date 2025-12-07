// Admin authentication with Firebase-backed credentials
// Supports both default credentials and custom credentials stored in Firebase

const ADMIN_SESSION_KEY = 'bmr_admin_session';

// Default credentials (fallback when no custom credentials are set)
const DEFAULT_USERNAME = 'username';
const DEFAULT_PASSWORD = 'password';

/**
 * Validate admin credentials against Firebase
 * Falls back to default credentials if Firebase check fails or no custom credentials set
 */
export async function validateAdminCredentialsAsync(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      console.error('❌ Credential validation request failed');
      // Fallback to local validation
      return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
    }
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('❌ Error validating credentials:', error);
    // Fallback to local validation if API fails
    return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
  }
}

/**
 * Synchronous credential validation (for backwards compatibility)
 * Note: This only checks against default credentials
 * Use validateAdminCredentialsAsync for full validation
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
}

export function setAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  }
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function isAdminAuthenticated(): boolean {
  console.log('🔐 isAdminAuthenticated() called');
  console.log('🔐 Window available:', typeof window !== 'undefined');
  
  if (typeof window !== 'undefined') {
    const sessionValue = sessionStorage.getItem(ADMIN_SESSION_KEY);
    console.log('🔐 SessionStorage key:', ADMIN_SESSION_KEY);
    console.log('🔐 SessionStorage value:', sessionValue);
    
    const result = sessionValue === 'true';
    console.log('🔐 isAdminAuthenticated() returning:', result);
    return result;
  }
  
  console.log('🔐 isAdminAuthenticated() returning false (SSR)');
  return false;
}

/**
 * Update admin credentials
 */
export async function updateAdminCredentials(
  currentPassword: string,
  newUsername?: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/credentials', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newUsername,
        newPassword,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update credentials' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating credentials:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Get current admin username
 */
export async function getAdminUsername(): Promise<string> {
  try {
    const response = await fetch('/api/admin/credentials');
    
    if (!response.ok) {
      return DEFAULT_USERNAME;
    }
    
    const data = await response.json();
    return data.username || DEFAULT_USERNAME;
  } catch (error) {
    console.error('❌ Error fetching username:', error);
    return DEFAULT_USERNAME;
  }
}
