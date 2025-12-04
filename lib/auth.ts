import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from './firebase/client';

/**
 * Client-side Auth Functions
 * Safe to use in client components
 */

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
    // Clear any session storage related to auth
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('googleSignInRedirect');
      sessionStorage.removeItem('loginRedirect');
    }
    
    await firebaseSignOut(auth);
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

// Export aliases for backward compatibility
export const signOut = signOutUser;
export const registerWithEmail = signUpWithEmail;
export const resetPassword = sendPasswordResetEmail;

/**
 * Sign in with Google using popup (more reliable than redirect)
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    
    // Use popup - more reliable than redirect
    const result = await signInWithPopup(auth, provider);
    
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    // Handle specific errors
    if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Sign-in cancelled' };
    }
    if (error.code === 'auth/popup-blocked') {
      return { user: null, error: 'Popup was blocked. Please allow popups for this site.' };
    }
    
    return { 
      user: null, 
      error: error.message || 'Failed to sign in with Google'
    };
  }
}

/**
 * Check for Google redirect result on page load
 * Call this in the auth context/provider on mount
 */
export async function checkGoogleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    
    if (result) {
      return { user: result.user, error: null, isNewUser: true };
    }
    
    return { user: null, error: null };
  } catch (error: any) {
    console.error('Error checking redirect result:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/unauthorized-domain') {
      return { 
        user: null, 
        error: 'This domain is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains.' 
      };
    }
    
    return { 
      user: null, 
      error: error.message || 'Failed to complete Google sign-in'
    };
  }
}
