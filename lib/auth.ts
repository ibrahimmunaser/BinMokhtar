import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
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
 * Sign in with Google using popup
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    // Optional: Add custom parameters
    provider.setCustomParameters({
      prompt: 'select_account', // Always show account selection
    });
    
    const result = await signInWithPopup(auth, provider);
    
    // You can get additional Google-specific info if needed
    // const credential = GoogleAuthProvider.credentialFromResult(result);
    // const token = credential?.accessToken;
    
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Sign-in popup was closed. Please try again.' };
    } else if (error.code === 'auth/popup-blocked') {
      return { user: null, error: 'Sign-in popup was blocked. Please allow popups for this site.' };
    } else if (error.code === 'auth/cancelled-popup-request') {
      return { user: null, error: 'Multiple popup requests detected. Please try again.' };
    } else if (error.code === 'auth/unauthorized-domain') {
      return { 
        user: null, 
        error: 'This domain is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains.' 
      };
    } else if (error.code === 'auth/operation-not-allowed') {
      return { 
        user: null, 
        error: 'Google sign-in is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.' 
      };
    } else if (error.code === 'auth/invalid-api-key') {
      return { 
        user: null, 
        error: 'Invalid Firebase API key. Please check your Firebase configuration.' 
      };
    } else if (error.code === 'auth/app-deleted' || error.code === 'auth/invalid-app-credential') {
      return { 
        user: null, 
        error: 'Firebase app configuration error. Please check your Firebase setup.' 
      };
    }
    
    // Return detailed error for debugging
    return { 
      user: null, 
      error: `Sign-in failed: ${error.message || 'Unknown error'}${error.code ? ` (${error.code})` : ''}`
    };
  }
}
