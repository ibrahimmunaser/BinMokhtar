// Simple admin authentication
// In production, this would use proper auth like Firebase Auth

const ADMIN_USERNAME = 'username';
const ADMIN_PASSWORD = 'password';
const ADMIN_SESSION_KEY = 'bmr_admin_session';

export function validateAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
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
    console.log('🔐 SessionStorage value type:', typeof sessionValue);
    console.log('🔐 Comparison result:', sessionValue === 'true');
    console.log('🔐 All sessionStorage items:', Object.fromEntries(Object.entries(sessionStorage)));
    
    const result = sessionValue === 'true';
    console.log('🔐 isAdminAuthenticated() returning:', result);
    return result;
  }
  
  console.log('🔐 isAdminAuthenticated() returning false (SSR)');
  return false;
}













