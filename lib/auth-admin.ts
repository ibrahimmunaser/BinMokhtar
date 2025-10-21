import { adminAuth } from './firebase/server';

/**
 * Server-side Admin Auth Functions
 * ONLY USE IN SERVER COMPONENTS, API ROUTES, OR SERVER ACTIONS
 */

export async function verifyAdminRole(uid: string): Promise<boolean> {
  try {
    const user = await adminAuth().getUser(uid);
    return user.customClaims?.role === 'ADMIN';
  } catch (error) {
    console.error('Error verifying admin role:', error);
    return false;
  }
}

export async function setAdminRole(uid: string, isAdmin: boolean = true): Promise<void> {
  try {
    await adminAuth().setCustomUserClaims(uid, { role: isAdmin ? 'ADMIN' : null });
    console.log(`✅ ${isAdmin ? 'Set' : 'Removed'} admin role for user ${uid}`);
  } catch (error) {
    console.error('Error setting admin role:', error);
    throw error;
  }
}

export async function requireAdmin(uid: string | undefined) {
  if (!uid) {
    throw new Error('Unauthorized: Not signed in');
  }
  
  const isAdmin = await verifyAdminRole(uid);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return true;
}

