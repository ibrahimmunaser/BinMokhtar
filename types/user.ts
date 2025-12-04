/**
 * User & Profile Types for BMR Authentication System
 */

import type { LocationZone, FulfillmentMethod } from '@/lib/shipping/config';

/**
 * Auth provider information
 */
export type AuthProvider = 'credentials' | 'google';

/**
 * User profile stored in Firestore
 * Linked to Firebase Auth user by uid
 */
export interface UserProfile {
  // Core identity (from Firebase Auth)
  uid: string;
  email: string;
  emailVerified: boolean;
  
  // Display info
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  
  // Auth provider info
  authProviders: AuthProvider[];
  
  // Contact
  phoneNumber: string | null;
  
  // Delivery preferences
  defaultLocationZone: LocationZone | null;
  defaultFulfillmentMethod: FulfillmentMethod | null;
  
  // Profile completion status
  isProfileComplete?: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Data for creating/updating user profile
 */
export interface UserProfileUpdate {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  defaultLocationZone?: LocationZone | null;
  defaultFulfillmentMethod?: FulfillmentMethod | null;
  isProfileComplete?: boolean;
}

/**
 * User with profile data combined
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  profile: UserProfile | null;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

/**
 * Auth state for context
 */
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Sign up form data
 */
export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Sign in form data
 */
export interface SignInFormData {
  email: string;
  password: string;
}

