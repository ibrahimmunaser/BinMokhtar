// Initialize Firebase with default categories
// Run this once: npx tsx scripts/init-firebase.ts

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load service account
const serviceAccountPath = path.join(process.cwd(), 'binmokhtar2-967ad-firebase-adminsdk-fbsvc-caad4a2ee6.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function initializeFirebase() {
  console.log('🚀 Initializing Firebase with default data...\n');

  // Default categories
  const categories = [
    { 
      id: 'thobes', 
      name: 'Thobes', 
      slug: 'thobes', 
      description: 'Traditional Islamic robes for men and boys', 
      active: true, 
      productCount: 0 
    },
    { 
      id: 'shemaghs', 
      name: 'Shemaghs', 
      slug: 'shemaghs', 
      description: 'Traditional head scarves', 
      active: true, 
      productCount: 0 
    },
    { 
      id: 'shaals', 
      name: 'Shaals', 
      slug: 'shaals', 
      description: 'Hand-woven traditional scarves', 
      active: true, 
      productCount: 0 
    },
    { 
      id: 'kufis', 
      name: 'Kufis', 
      slug: 'kufis', 
      description: 'Traditional prayer caps', 
      active: true, 
      productCount: 0 
    },
  ];

  // Add categories
  console.log('📦 Adding default categories...');
  for (const category of categories) {
    const { id, ...data } = category;
    await db.collection('categories').doc(id).set(data);
    console.log(`  ✅ Added category: ${category.name}`);
  }

  console.log('\n✅ Firebase initialization complete!');
  console.log('\n📊 Next steps:');
  console.log('1. Your admin panel is ready at http://localhost:3000/admin');
  console.log('2. Login with: username / password');
  console.log('3. Add products through the admin panel');
  console.log('4. Products will save to Firestore (cloud database)');
  
  process.exit(0);
}

initializeFirebase().catch((error) => {
  console.error('❌ Error initializing Firebase:', error);
  process.exit(1);
});


