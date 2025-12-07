import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { sendCredentialVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

const CREDENTIALS_COLLECTION = 'settings';
const CREDENTIALS_DOC = 'admin_credentials';
const PENDING_CHANGES_DOC = 'admin_credentials_pending';

// Default credentials (used when no custom credentials are set)
const DEFAULT_USERNAME = 'username';
const DEFAULT_PASSWORD = 'password';

// Business email for verification (must be set in environment)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'binmukhtar2025@gmail.com';

// Verification code expiration (15 minutes)
const CODE_EXPIRATION_MS = 15 * 60 * 1000;

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

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
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

// POST - Validate credentials (for login) OR request credential change
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    // If action is 'request_change', initiate credential change with email verification
    if (action === 'request_change') {
      return handleRequestChange(body);
    }
    
    // Default: validate credentials for login
    return handleLogin(body);
  } catch (error) {
    console.error('Error in credentials POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Handle login validation
async function handleLogin(body: any) {
  const { username, password } = body;
  
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
}

// Handle credential change request (Step 1: Send verification email)
async function handleRequestChange(body: any) {
  const { currentPassword, newUsername, newPassword } = body;
  
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
    currentPasswordValid = currentPassword === DEFAULT_PASSWORD;
  } else {
    const data = doc.data();
    currentUsername = data?.username || DEFAULT_USERNAME;
    const storedHash = data?.passwordHash;
    const storedSalt = data?.passwordSalt;
    
    if (storedHash && storedSalt) {
      currentPasswordValid = verifyPassword(currentPassword, storedHash, storedSalt);
    } else {
      currentPasswordValid = currentPassword === DEFAULT_PASSWORD;
    }
  }
  
  if (!currentPasswordValid) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 401 }
    );
  }
  
  // Generate verification code
  const verificationCode = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MS);
  
  // Determine change type for email
  let changeType: 'username' | 'password' | 'both' = 'password';
  if (newUsername && newPassword) {
    changeType = 'both';
  } else if (newUsername) {
    changeType = 'username';
  }
  
  // Store pending change in Firebase
  const pendingChange: any = {
    verificationCode,
    expiresAt,
    createdAt: new Date(),
    changeType,
  };
  
  if (newUsername) {
    pendingChange.newUsername = newUsername;
  }
  
  if (newPassword) {
    // Hash the new password before storing
    const { hash, salt } = hashPassword(newPassword);
    pendingChange.newPasswordHash = hash;
    pendingChange.newPasswordSalt = salt;
  }
  
  // Keep current credentials info for the update
  if (!newUsername && doc.exists) {
    pendingChange.keepUsername = doc.data()?.username || DEFAULT_USERNAME;
  }
  if (!newPassword && doc.exists) {
    pendingChange.keepPasswordHash = doc.data()?.passwordHash;
    pendingChange.keepPasswordSalt = doc.data()?.passwordSalt;
  }
  
  await db.collection(CREDENTIALS_COLLECTION).doc(PENDING_CHANGES_DOC).set(pendingChange);
  
  // Send verification email
  const emailResult = await sendCredentialVerificationEmail(
    ADMIN_EMAIL,
    verificationCode,
    changeType
  );
  
  if (!emailResult.success) {
    console.error('Failed to send verification email:', emailResult.error);
    return NextResponse.json(
      { error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
  
  console.log('✅ Verification code sent to:', ADMIN_EMAIL);
  
  // Return masked email for UI feedback
  const maskedEmail = maskEmail(ADMIN_EMAIL);
  
  return NextResponse.json({
    success: true,
    message: `Verification code sent to ${maskedEmail}`,
    maskedEmail,
    expiresIn: 15, // minutes
  });
}

// PUT - Verify code and apply credential changes (Step 2)
export async function PUT(request: NextRequest) {
  try {
    const { verificationCode } = await request.json();
    
    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }
    
    const db = adminDb();
    const pendingRef = db.collection(CREDENTIALS_COLLECTION).doc(PENDING_CHANGES_DOC);
    const pendingDoc = await pendingRef.get();
    
    if (!pendingDoc.exists) {
      return NextResponse.json(
        { error: 'No pending credential change found. Please request a new change.' },
        { status: 400 }
      );
    }
    
    const pendingData = pendingDoc.data();
    
    // Ensure pendingData exists (TypeScript safety)
    if (!pendingData) {
      return NextResponse.json(
        { error: 'No pending credential change found. Please request a new change.' },
        { status: 400 }
      );
    }
    
    // Check if code has expired
    const expiresAt = pendingData.expiresAt?.toDate?.() || new Date(pendingData.expiresAt);
    if (new Date() > expiresAt) {
      // Delete expired pending change
      await pendingRef.delete();
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new change.' },
        { status: 400 }
      );
    }
    
    // Verify the code
    if (pendingData.verificationCode !== verificationCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }
    
    // Code is valid - apply the changes
    const credentialsRef = db.collection(CREDENTIALS_COLLECTION).doc(CREDENTIALS_DOC);
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Apply username change
    if (pendingData.newUsername) {
      updateData.username = pendingData.newUsername;
    } else if (pendingData.keepUsername) {
      updateData.username = pendingData.keepUsername;
    } else {
      updateData.username = DEFAULT_USERNAME;
    }
    
    // Apply password change
    if (pendingData.newPasswordHash && pendingData.newPasswordSalt) {
      updateData.passwordHash = pendingData.newPasswordHash;
      updateData.passwordSalt = pendingData.newPasswordSalt;
    } else if (pendingData.keepPasswordHash && pendingData.keepPasswordSalt) {
      updateData.passwordHash = pendingData.keepPasswordHash;
      updateData.passwordSalt = pendingData.keepPasswordSalt;
    } else {
      // Hash default password if creating new credentials doc
      const { hash, salt } = hashPassword(DEFAULT_PASSWORD);
      updateData.passwordHash = hash;
      updateData.passwordSalt = salt;
    }
    
    // Save the new credentials
    await credentialsRef.set(updateData, { merge: true });
    
    // Delete the pending change
    await pendingRef.delete();
    
    console.log('✅ Admin credentials updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Credentials updated successfully',
      username: updateData.username,
      passwordChanged: !!pendingData.newPasswordHash,
    });
  } catch (error) {
    console.error('Error verifying credential change:', error);
    return NextResponse.json(
      { error: 'Failed to verify credential change' },
      { status: 500 }
    );
  }
}

// Helper to mask email for display
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.***';
  
  const maskedLocal = local.length > 3 
    ? local.substring(0, 2) + '***' + local.substring(local.length - 1)
    : local.substring(0, 1) + '***';
  
  return `${maskedLocal}@${domain}`;
}
