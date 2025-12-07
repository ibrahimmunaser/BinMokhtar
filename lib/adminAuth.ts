// Admin authentication with Firebase-backed credentials
// Credentials are stored in Firestore at settings/admin_credentials

const ADMIN_SESSION_KEY = 'bmr_admin_session';
const ADMIN_USERNAME_KEY = 'bmr_admin_username';

// Validate credentials against Firebase (async)
export async function validateAdminCredentialsAsync(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/credentials?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
    const data = await response.json();
    
    if (data.isDefault) {
      console.warn('⚠️ Using default admin credentials. Please change them in Settings!');
    }
    
    return data.valid === true;
  } catch (error) {
    console.error('Error validating credentials:', error);
    // Fallback to hardcoded credentials if API fails
    return username === 'admin' && password === 'admin123';
  }
}

// Legacy sync validation (for backwards compatibility - checks session only)
export function validateAdminCredentials(username: string, password: string): boolean {
  // This is now a placeholder - actual validation should use validateAdminCredentialsAsync
  // Keep for backwards compatibility during transition
  console.warn('⚠️ Using sync credential validation. Consider using validateAdminCredentialsAsync instead.');
  return username === 'admin' && password === 'admin123';
}

export function setAdminSession(username?: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    if (username) {
      sessionStorage.setItem(ADMIN_USERNAME_KEY, username);
    }
  }
}

export function getAdminUsername(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(ADMIN_USERNAME_KEY);
  }
  return null;
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_USERNAME_KEY);
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    const sessionValue = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return sessionValue === 'true';
  }
  return false;
}

// Update admin credentials
export async function updateAdminCredentials(
  currentUsername: string,
  currentPassword: string,
  newUsername?: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/admin/credentials', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentUsername,
        currentPassword,
        newUsername,
        newPassword,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update credentials' };
    }

    // Update stored username if changed
    if (newUsername && typeof window !== 'undefined') {
      sessionStorage.setItem(ADMIN_USERNAME_KEY, newUsername);
    }

    return { success: true, message: data.message };
  } catch (error: any) {
    console.error('Error updating credentials:', error);
    return { success: false, error: error.message || 'Failed to update credentials' };
  }
}
