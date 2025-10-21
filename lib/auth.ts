import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from './firebase/client';
import { adminAuth } from './firebase/server';

// ============================================================================
// Client-side Auth Functions
// ============================================================================

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function sendPasswordResetEmail(email: string) {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUserProfile(user: User, data: { displayName?: string; photoURL?: string }) {
  try {
    await updateProfile(user, data);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============================================================================
// Server-side Auth Functions (Admin SDK)
// ============================================================================

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

// ============================================================================
// Auth Guards (Server Components)
// ============================================================================

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
