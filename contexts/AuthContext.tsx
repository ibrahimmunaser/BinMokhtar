'use client';

/**
 * Authentication Context
 * Provides auth state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle,
  signOutUser 
} from '@/lib/auth';
import { 
  getUserProfile, 
  createOrUpdateUserProfile, 
  updateUserProfileData 
} from '@/lib/user-profile';
import type { User } from 'firebase/auth';
import type { AuthUser, UserProfile, UserProfileUpdate, AuthProvider } from '@/types/user';
import { useLocationStore } from '@/store/location';

interface AuthContextType {
  // Auth state
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isNewGoogleUser: boolean; // True if user just signed up via Google redirect
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInGoogle: () => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  signOut: () => Promise<void>;
  
  // Profile methods
  updateProfile: (updates: UserProfileUpdate) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  
  // Clear error
  clearError: () => void;
  clearNewGoogleUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // State to track if we're processing a Google redirect
  const [googleRedirectProcessed, setGoogleRedirectProcessed] = useState(false);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);
  
  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Note: We now use popup-based Google sign-in, so no redirect handling needed
  
  // Location store for syncing default address
  const setLocationZone = useLocationStore((state) => state.setLocationZone);
  const locationZone = useLocationStore((state) => state.locationZone);
  
  // Build AuthUser from Firebase user and profile
  const user: AuthUser | null = firebaseUser ? {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    displayName: firebaseUser.displayName || profile?.displayName || null,
    photoURL: firebaseUser.photoURL || profile?.photoURL || null,
    profile,
    metadata: {
      creationTime: firebaseUser.metadata?.creationTime || undefined,
      lastSignInTime: firebaseUser.metadata?.lastSignInTime || undefined,
    },
  } : null;
  
  // Include mounted state in loading to prevent hydration mismatches
  const isLoading = !mounted || firebaseLoading || isLoadingProfile;
  const isAuthenticated = mounted && !!firebaseUser && !firebaseLoading;
  
  // Load user profile when Firebase user changes
  useEffect(() => {
    async function loadProfile() {
      if (!firebaseUser) {
        setProfile(null);
        return;
      }
      
      setIsLoadingProfile(true);
      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
        
        // Sync default address to location store if user has one saved
        // and no address is currently set
        if (userProfile?.defaultLocationZone && !locationZone) {
          setLocationZone(userProfile.defaultLocationZone);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    
    loadProfile();
  }, [firebaseUser?.uid, firebaseLoading, locationZone, setLocationZone]);
  
  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.error) {
        // Map Firebase errors to user-friendly messages
        const errorMessage = mapAuthError(result.error);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      if (result.user) {
        // Update profile with login timestamp
        await createOrUpdateUserProfile(result.user, 'credentials');
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = mapAuthError(err.message);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);
  
  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    
    try {
      const result = await signUpWithEmail(email, password, name);
      
      if (result.error) {
        const errorMessage = mapAuthError(result.error);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      if (result.user) {
        // Create user profile
        await createOrUpdateUserProfile(result.user, 'credentials', { displayName: name });
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = mapAuthError(err.message);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);
  
  // Sign in with Google (popup-based)
  const signInGoogle = useCallback(async () => {
    setError(null);
    
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      // Handle the authenticated user
      let isNewUser = false;
      if (result.user) {
        try {
          const existingProfile = await getUserProfile(result.user.uid);
          isNewUser = !existingProfile;
          
          if (isNewUser) {
            setIsNewGoogleUser(true);
          }
          
          await createOrUpdateUserProfile(result.user, 'google');
        } catch {
          // Don't fail the sign-in if profile update fails
        }
      }
      
      return { success: true, isNewUser };
    } catch (err: any) {
      console.error('Sign in with Google error:', err);
      const errorMessage = err.message || 'Failed to sign in with Google';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);
  
  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      await signOutUser();
      setProfile(null);
      setIsNewGoogleUser(false);
      setGoogleRedirectProcessed(false); // Reset so next sign-in can process redirect
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  }, []);
  
  // Update profile
  const updateProfile = useCallback(async (updates: UserProfileUpdate) => {
    if (!firebaseUser) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      await updateUserProfileData(firebaseUser.uid, updates);
      
      // Refresh profile
      const updatedProfile = await getUserProfile(firebaseUser.uid);
      setProfile(updatedProfile);
      
      // Sync location if updated
      if (updates.defaultLocationZone !== undefined) {
        if (updates.defaultLocationZone) {
          setLocationZone(updates.defaultLocationZone);
        }
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      return { success: false, error: errorMessage };
    }
  }, [firebaseUser, setLocationZone]);
  
  // Refresh profile from database
  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    
    try {
      const userProfile = await getUserProfile(firebaseUser.uid);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  }, [firebaseUser]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Clear new Google user flag (after redirect to complete-profile)
  const clearNewGoogleUser = useCallback(() => {
    setIsNewGoogleUser(false);
  }, []);
  
  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    error: error || (firebaseError?.message || null),
    isNewGoogleUser,
    signIn,
    signUp,
    signInGoogle,
    signOut,
    updateProfile,
    refreshProfile,
    clearError,
    clearNewGoogleUser,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Map Firebase auth errors to user-friendly messages
 */
function mapAuthError(error: string): string {
  // Don't reveal whether email exists for security
  if (error.includes('user-not-found') || error.includes('wrong-password')) {
    return 'Invalid email or password. Please try again.';
  }
  if (error.includes('email-already-in-use')) {
    return 'An account with this email already exists. Try signing in or use "Continue with Google" if you registered with Google.';
  }
  if (error.includes('weak-password')) {
    return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
  }
  if (error.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (error.includes('too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (error.includes('network-request-failed')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (error.includes('popup-closed')) {
    return 'Sign-in popup was closed. Please try again.';
  }
  if (error.includes('popup-blocked')) {
    return 'Sign-in popup was blocked. Please allow popups for this site.';
  }
  
  // Return original error if no mapping found
  return error;
}

