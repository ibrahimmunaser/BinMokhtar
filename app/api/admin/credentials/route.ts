import { NextResponse } from 'next/server';
import { db, Timestamp } from '@/lib/firebase/server';
import crypto from 'crypto';

// Simple hash function for password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET - Validate credentials (for login)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!username || !password) {
      return NextResponse.json({ valid: false, error: 'Missing credentials' }, { status: 400 });
    }

    // Get credentials from Firebase
    const credentialsDoc = await db.collection('settings').doc('admin_credentials').get();
    
    if (!credentialsDoc.exists) {
      // Initialize with default credentials if none exist
      const defaultUsername = 'admin';
      const defaultPassword = hashPassword('admin123');
      
      await db.collection('settings').doc('admin_credentials').set({
        username: defaultUsername,
        passwordHash: defaultPassword,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Check against defaults
      const isValid = username === defaultUsername && hashPassword(password) === defaultPassword;
      return NextResponse.json({ 
        valid: isValid,
        isDefault: true,
        message: isValid ? 'Login successful (using default credentials - please change them!)' : 'Invalid credentials'
      });
    }

    const data = credentialsDoc.data();
    const storedUsername = data?.username;
    const storedPasswordHash = data?.passwordHash;

    const isValid = username === storedUsername && hashPassword(password) === storedPasswordHash;

    return NextResponse.json({ 
      valid: isValid,
      message: isValid ? 'Login successful' : 'Invalid credentials'
    });
  } catch (error: any) {
    console.error('Error validating credentials:', error);
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update credentials
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { currentUsername, currentPassword, newUsername, newPassword } = body;

    if (!currentUsername || !currentPassword) {
      return NextResponse.json({ success: false, error: 'Current credentials required' }, { status: 400 });
    }

    if (!newUsername && !newPassword) {
      return NextResponse.json({ success: false, error: 'No new credentials provided' }, { status: 400 });
    }

    // Get current credentials from Firebase
    const credentialsDoc = await db.collection('settings').doc('admin_credentials').get();
    
    let storedUsername = 'admin';
    let storedPasswordHash = hashPassword('admin123');
    
    if (credentialsDoc.exists) {
      const data = credentialsDoc.data();
      storedUsername = data?.username || storedUsername;
      storedPasswordHash = data?.passwordHash || storedPasswordHash;
    }

    // Validate current credentials
    const isCurrentValid = currentUsername === storedUsername && hashPassword(currentPassword) === storedPasswordHash;
    
    if (!isCurrentValid) {
      return NextResponse.json({ success: false, error: 'Current credentials are incorrect' }, { status: 401 });
    }

    // Validate new credentials
    if (newUsername && newUsername.length < 3) {
      return NextResponse.json({ success: false, error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Update credentials
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (newUsername) {
      updateData.username = newUsername;
    }

    if (newPassword) {
      updateData.passwordHash = hashPassword(newPassword);
    }

    await db.collection('settings').doc('admin_credentials').set(
      updateData,
      { merge: true }
    );

    console.log('✅ Admin credentials updated successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Credentials updated successfully',
      updatedFields: {
        username: !!newUsername,
        password: !!newPassword
      }
    });
  } catch (error: any) {
    console.error('Error updating credentials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Initialize default credentials (first time setup)
export async function POST() {
  try {
    const credentialsDoc = await db.collection('settings').doc('admin_credentials').get();
    
    if (credentialsDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credentials already exist',
        message: 'Use PUT to update credentials'
      }, { status: 400 });
    }

    // Create default credentials
    await db.collection('settings').doc('admin_credentials').set({
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Default credentials created. Username: admin, Password: admin123. Please change these immediately!'
    });
  } catch (error: any) {
    console.error('Error initializing credentials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

