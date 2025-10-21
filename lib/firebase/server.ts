import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Only runs on server-side
 */
export function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  try {
    // Decode base64-encoded service account JSON
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. ' +
        'Please set it to a base64-encoded service account JSON.'
      );
    }

    // Decode from base64
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
    );

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    console.log('✅ Firebase Admin SDK initialized');
    return adminApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Export initialized services
export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());

/**
 * Verify admin role from custom claims
 */
export async function verifyAdmin(uid: string): Promise<boolean> {
  try {
    const user = await adminAuth().getUser(uid);
    return user.customClaims?.role === 'ADMIN';
  } catch (error) {
    console.error('Error verifying admin:', error);
    return false;
  }
}

/**
 * Set custom claims (admin role)
 */
export async function setAdminRole(uid: string, isAdmin: boolean = true): Promise<void> {
  try {
    await adminAuth().setCustomUserClaims(uid, { role: isAdmin ? 'ADMIN' : null });
    console.log(`✅ ${isAdmin ? 'Set' : 'Removed'} admin role for user ${uid}`);
  } catch (error) {
    console.error('Error setting admin role:', error);
    throw error;
  }
}


