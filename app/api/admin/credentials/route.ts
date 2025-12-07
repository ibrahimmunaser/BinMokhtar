import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import crypto from 'crypto';

const CREDENTIALS_COLLECTION = 'settings';
const CREDENTIALS_DOC = 'admin_credentials';

// Default credentials (used when no custom credentials are set)
const DEFAULT_USERNAME = 'username';
const DEFAULT_PASSWORD = 'password';

// Hash password using PBKDF2
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, useSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: useSalt };
}

// Verify password
function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

// GET - Check if credentials exist and get username
export async function GET() {
  try {
    const db = adminDb();
    const doc = await db.collection(CREDENTIALS_COLLECTION).doc(CREDENTIALS_DOC).get();
    
    if (!doc.exists) {
      return NextResponse.json({
        hasCustomCredentials: false,
        username: DEFAULT_USERNAME,
        message: 'Using default credentials'
      });
    }
    
    const data = doc.data();
    return NextResponse.json({
      hasCustomCredentials: true,
      username: data?.username || DEFAULT_USERNAME,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null
    });
  } catch (error) {
    console.error('Error fetching admin credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

// POST - Validate credentials (for login)
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    const db = adminDb();
    const doc = await db.collection(CREDENTIALS_COLLECTION).doc(CREDENTIALS_DOC).get();
    
    // If no custom credentials, use defaults
    if (!doc.exists) {
      const isValid = username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
      return NextResponse.json({ 
        valid: isValid,
        isDefault: true,
        message: isValid ? 'Login successful' : 'Invalid credentials'
      });
    }
    
    const data = doc.data();
    const storedUsername = data?.username;
    const storedHash = data?.passwordHash;
    const storedSalt = data?.passwordSalt;
    
    if (!storedUsername || !storedHash || !storedSalt) {
      // Fallback to default if data is corrupted
      const isValid = username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
      return NextResponse.json({ 
        valid: isValid,
        isDefault: true
      });
    }
    
    const usernameMatch = username === storedUsername;
    const passwordMatch = verifyPassword(password, storedHash, storedSalt);
    
    return NextResponse.json({ 
      valid: usernameMatch && passwordMatch,
      isDefault: false,
      message: (usernameMatch && passwordMatch) ? 'Login successful' : 'Invalid credentials'
    });
  } catch (error) {
    console.error('Error validating credentials:', error);
    return NextResponse.json(
      { error: 'Failed to validate credentials' },
      { status: 500 }
    );
  }
}

// PUT - Update credentials
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newUsername, newPassword } = await request.json();
    
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required' },
        { status: 400 }
      );
    }
    
    if (!newUsername && !newPassword) {
      return NextResponse.json(
        { error: 'New username or new password is required' },
        { status: 400 }
      );
    }
    
    // Validate new password strength
    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Validate new username
    if (newUsername && newUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    const db = adminDb();
    const docRef = db.collection(CREDENTIALS_COLLECTION).doc(CREDENTIALS_DOC);
    const doc = await docRef.get();
    
    // Verify current password
    let currentPasswordValid = false;
    let currentUsername = DEFAULT_USERNAME;
    
    if (!doc.exists) {
      // Using default credentials
      currentPasswordValid = currentPassword === DEFAULT_PASSWORD;
    } else {
      const data = doc.data();
      currentUsername = data?.username || DEFAULT_USERNAME;
      const storedHash = data?.passwordHash;
      const storedSalt = data?.passwordSalt;
      
      if (storedHash && storedSalt) {
        currentPasswordValid = verifyPassword(currentPassword, storedHash, storedSalt);
      } else {
        // Fallback to default
        currentPasswordValid = currentPassword === DEFAULT_PASSWORD;
      }
    }
    
    if (!currentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Update username if provided
    if (newUsername) {
      updateData.username = newUsername;
    } else if (!doc.exists) {
      // Keep current username
      updateData.username = currentUsername;
    }
    
    // Update password if provided
    if (newPassword) {
      const { hash, salt } = hashPassword(newPassword);
      updateData.passwordHash = hash;
      updateData.passwordSalt = salt;
    } else if (doc.exists) {
      // Keep existing password hash and salt
      const data = doc.data();
      updateData.passwordHash = data?.passwordHash;
      updateData.passwordSalt = data?.passwordSalt;
    } else {
      // Hash the default password since we're creating the document
      const { hash, salt } = hashPassword(DEFAULT_PASSWORD);
      updateData.passwordHash = hash;
      updateData.passwordSalt = salt;
    }
    
    // Save to Firebase
    await docRef.set(updateData, { merge: true });
    
    console.log('✅ Admin credentials updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Credentials updated successfully',
      username: updateData.username
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return NextResponse.json(
      { error: 'Failed to update credentials' },
      { status: 500 }
    );
  }
}

