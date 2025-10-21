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
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  }
  return false;
}


