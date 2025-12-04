/**
 * User Profile Management
 * Handles CRUD operations for user profiles in Firestore
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import type { UserProfile, UserProfileUpdate, AuthProvider } from '@/types/user';
import type { LocationZone, FulfillmentMethod } from '@/lib/shipping/config';

const USERS_COLLECTION = 'users';

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const data = userSnap.data();
    return {
      uid: data.uid,
      email: data.email,
      emailVerified: data.emailVerified || false,
      displayName: data.displayName || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      photoURL: data.photoURL || null,
      authProviders: data.authProviders || ['credentials'],
      phoneNumber: data.phoneNumber || null,
      defaultLocationZone: data.defaultLocationZone || null,
      defaultFulfillmentMethod: data.defaultFulfillmentMethod || null,
      isProfileComplete: data.isProfileComplete || false,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : new Date(data.updatedAt),
      lastLoginAt: data.lastLoginAt 
        ? (data.lastLoginAt instanceof Timestamp 
            ? data.lastLoginAt.toDate() 
            : new Date(data.lastLoginAt))
        : null,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create or update user profile from Firebase Auth user
 * Handles account linking for Google sign-in
 */
export async function createOrUpdateUserProfile(
  firebaseUser: User,
  provider: AuthProvider = 'credentials',
  additionalData?: { displayName?: string }
): Promise<UserProfile> {
  console.log('🔴 [USER PROFILE] createOrUpdateUserProfile() called');
  console.log('🔴 [USER PROFILE] User ID:', firebaseUser.uid);
  console.log('🔴 [USER PROFILE] Provider:', provider);
  console.log('🔴 [USER PROFILE] User email:', firebaseUser.email);
  console.log('🔴 [USER PROFILE] User displayName:', firebaseUser.displayName);
  
  const startTime = Date.now();
  const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
  
  console.log('🔴 [USER PROFILE] Checking for existing profile...');
  const existingProfile = await getUserProfile(firebaseUser.uid);
  console.log('🔴 [USER PROFILE] Existing profile:', existingProfile ? 'found' : 'not found');
  
  // Parse display name into first/last
  const fullName = additionalData?.displayName || firebaseUser.displayName || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
  
  if (existingProfile) {
    console.log('🔴 [USER PROFILE] Updating existing profile');
    // Update existing profile - merge providers if new
    const providers = existingProfile.authProviders.includes(provider)
      ? existingProfile.authProviders
      : [...existingProfile.authProviders, provider];
    
    const updateData: Record<string, any> = {
      emailVerified: firebaseUser.emailVerified,
      authProviders: providers,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Update photo if coming from Google and we don't have one
    if (provider === 'google' && firebaseUser.photoURL && !existingProfile.photoURL) {
      updateData.photoURL = firebaseUser.photoURL;
    }
    
    // Update display name if coming from Google and we don't have one
    if (provider === 'google' && fullName && !existingProfile.displayName) {
      updateData.displayName = fullName;
      updateData.firstName = firstName;
      updateData.lastName = lastName;
    }
    
    console.log('🔴 [USER PROFILE] Update data:', JSON.stringify(updateData, null, 2));
    console.log('🔴 [USER PROFILE] Writing to Firestore...');
    await setDoc(userRef, updateData, { merge: true });
    console.log('🔴 [USER PROFILE] Profile updated successfully');
    
    const result = {
      ...existingProfile,
      ...updateData,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };
    const duration = Date.now() - startTime;
    console.log('🔴 [USER PROFILE] createOrUpdateUserProfile() completed in', duration, 'ms');
    return result;
  }
  
  // Create new profile
  console.log('🔴 [USER PROFILE] Creating new profile');
  const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
    lastLoginAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    emailVerified: firebaseUser.emailVerified,
    displayName: fullName || null,
    firstName,
    lastName,
    photoURL: firebaseUser.photoURL || null,
    authProviders: [provider],
    phoneNumber: firebaseUser.phoneNumber || null,
    defaultLocationZone: null,
    defaultFulfillmentMethod: null,
    isProfileComplete: false, // New users need to complete profile
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };
  
  console.log('🔴 [USER PROFILE] New profile data:', JSON.stringify({
    ...newProfile,
    createdAt: '[serverTimestamp]',
    updatedAt: '[serverTimestamp]',
    lastLoginAt: '[serverTimestamp]',
  }, null, 2));
  console.log('🔴 [USER PROFILE] Writing to Firestore...');
  await setDoc(userRef, newProfile);
  console.log('🔴 [USER PROFILE] Profile created successfully');
  
  const result = {
    ...newProfile,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  } as UserProfile;
  const duration = Date.now() - startTime;
  console.log('🔴 [USER PROFILE] createOrUpdateUserProfile() completed in', duration, 'ms');
  return result;
}

/**
 * Update user profile fields
 * Uses setDoc with merge to handle both new and existing documents
 */
export async function updateUserProfileData(
  uid: string,
  updates: UserProfileUpdate
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  
  // Check if document exists to set createdAt for new documents
  const existingDoc = await getDoc(userRef);
  
  const updateData: Record<string, any> = {
    uid, // Ensure uid is always set
    updatedAt: serverTimestamp(),
  };
  
  // If document doesn't exist, set createdAt
  if (!existingDoc.exists()) {
    updateData.createdAt = serverTimestamp();
  }
  
  if (updates.displayName !== undefined) {
    updateData.displayName = updates.displayName;
    // Parse into first/last
    if (updates.displayName) {
      const nameParts = updates.displayName.trim().split(' ');
      updateData.firstName = nameParts[0] || null;
      updateData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }
  }
  
  if (updates.firstName !== undefined) {
    updateData.firstName = updates.firstName;
  }
  
  if (updates.lastName !== undefined) {
    updateData.lastName = updates.lastName;
  }
  
  if (updates.phoneNumber !== undefined) {
    updateData.phoneNumber = updates.phoneNumber;
  }
  
  if (updates.defaultLocationZone !== undefined) {
    updateData.defaultLocationZone = updates.defaultLocationZone;
  }
  
  if (updates.defaultFulfillmentMethod !== undefined) {
    updateData.defaultFulfillmentMethod = updates.defaultFulfillmentMethod;
  }
  
  if (updates.isProfileComplete !== undefined) {
    updateData.isProfileComplete = updates.isProfileComplete;
  }
  
  // Use setDoc with merge to create or update the document
  await setDoc(userRef, updateData, { merge: true });
}

/**
 * Update user's default delivery address
 */
export async function updateDefaultAddress(
  uid: string,
  locationZone: LocationZone | null
): Promise<void> {
  await updateUserProfileData(uid, { defaultLocationZone: locationZone });
}

/**
 * Update user's default fulfillment method
 */
export async function updateDefaultFulfillmentMethod(
  uid: string,
  method: FulfillmentMethod | null
): Promise<void> {
  await updateUserProfileData(uid, { defaultFulfillmentMethod: method });
}

/**
 * Check if a user profile exists by email
 * Used to detect potential account linking scenarios
 */
export async function checkUserExistsByEmail(email: string): Promise<boolean> {
  // Note: This would require a query by email field
  // For now, we rely on Firebase Auth's built-in account linking
  // which handles this automatically when using the same email
  return false;
}

