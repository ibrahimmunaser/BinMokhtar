/**
 * Upload all images from /public/images to Firebase Storage
 * 
 * Usage:
 *   node scripts/upload-images-to-firebase.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccount) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set');
    console.error('Make sure you have .env.local file with Firebase credentials');
    process.exit(1);
  }

  try {
    let credentials;
    
    // Try to decode from base64 first (if it's encoded)
    try {
      const decoded = Buffer.from(serviceAccount, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
      console.log('📝 Decoded base64-encoded credentials');
    } catch (e) {
      // If that fails, try parsing directly
      credentials = JSON.parse(serviceAccount);
      console.log('📝 Parsed JSON credentials');
    }
    
    // Try the new Firebase Storage bucket naming first, fallback to old format
    const bucketName = credentials.project_id + '.firebasestorage.app';
    
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      storageBucket: bucketName,
    });
    console.log('✅ Firebase Admin initialized');
    console.log('📦 Bucket:', bucketName);
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const bucket = admin.storage().bucket();
const uploadedFiles = [];

/**
 * Upload a single file to Firebase Storage
 */
async function uploadFile(localPath, remotePath) {
  console.log(`📤 Uploading: ${remotePath}`);
  
  const stats = fs.statSync(localPath);
  
  // Determine content type based on file extension
  const ext = path.extname(localPath).toLowerCase();
  const contentTypeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';
  
  // Upload file
  await bucket.upload(localPath, {
    destination: remotePath,
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1 year cache
      metadata: {
        uploadedBy: 'upload-images-script',
        uploadedAt: new Date().toISOString(),
      },
    },
  });
  
  // Make file publicly accessible
  const file = bucket.file(remotePath);
  await file.makePublic();
  
  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(remotePath).replace(/%2F/g, '/')}`;
  
  console.log(`✅ Uploaded: ${remotePath}`);
  
  return {
    localPath,
    remotePath,
    publicUrl,
    size: stats.size,
  };
}

/**
 * Recursively scan directory and upload all images
 */
async function uploadDirectory(localDir, remoteDir = '') {
  const items = fs.readdirSync(localDir);
  
  for (const item of items) {
    const localPath = path.join(localDir, item);
    const stats = fs.statSync(localPath);
    
    if (stats.isDirectory()) {
      // Recursively upload subdirectory
      const newRemoteDir = remoteDir ? `${remoteDir}/${item}` : item;
      await uploadDirectory(localPath, newRemoteDir);
    } else if (stats.isFile()) {
      // Check if it's an image file
      const ext = path.extname(item).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      
      if (imageExtensions.includes(ext)) {
        const remotePath = remoteDir ? `${remoteDir}/${item}` : item;
        try {
          const result = await uploadFile(localPath, remotePath);
          uploadedFiles.push(result);
        } catch (error) {
          console.error(`❌ Failed to upload ${remotePath}:`, error.message);
        }
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('📸 Firebase Storage Image Upload');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  
  if (!fs.existsSync(imagesDir)) {
    console.error('❌ Images directory not found:', imagesDir);
    process.exit(1);
  }
  
  console.log('📁 Scanning directory:', imagesDir);
  console.log('🎯 Firebase bucket:', bucket.name);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Upload all images
    await uploadDirectory(imagesDir, 'images');
    
    const duration = Date.now() - startTime;
    const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ Upload Complete!');
    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Total files uploaded: ${uploadedFiles.length}`);
    console.log(`📦 Total size: ${totalSizeMB} MB`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('');
    
    // Print all URLs
    console.log('📋 Uploaded Files & URLs:');
    console.log('─'.repeat(100));
    
    uploadedFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.remotePath}`);
      console.log(`   URL: ${file.publicUrl}`);
      console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log('');
    });
    
    // Save URLs to a JSON file
    const outputPath = path.join(process.cwd(), 'firebase-image-urls.json');
    const output = {
      uploadedAt: new Date().toISOString(),
      bucket: bucket.name,
      files: uploadedFiles.map(f => ({
        path: f.remotePath,
        url: f.publicUrl,
        size: f.size,
      })),
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log('💾 URLs saved to:', outputPath);
    console.log('');
    console.log('🔗 You can now use these URLs in your application!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Upload failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

