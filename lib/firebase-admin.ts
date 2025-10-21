// Deprecated: Eager Admin SDK init can break builds. Prefer lib/firebase/server.ts lazy init.
// Keeping file to avoid import errors; re-export from server-based lazy accessors.
import { adminDb as srvDb, adminAuth as srvAuth, adminStorage as srvStorage } from './firebase/server';

/**
 * Firebase Admin SDK initialization for server-side operations
 * This provides elevated privileges for admin operations
 */

export const adminDb = () => srvDb();
export const adminAuth = () => srvAuth();
export const adminStorage = () => srvStorage();




