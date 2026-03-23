/**
 * Deploy Firestore rules manually
 * Run: npx tsx scripts/deploy-firestore-rules.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
  
  let serviceAccount;
  try {
    const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } catch (e) {
    serviceAccount = JSON.parse(serviceAccountBase64);
  }
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}

async function deployRules() {
  try {
    console.log('📋 Reading firestore.rules...');
    const rules = fs.readFileSync('firestore.rules', 'utf-8');
    
    console.log('\n✅ Firestore rules content:');
    console.log('─'.repeat(80));
    console.log(rules);
    console.log('─'.repeat(80));
    
    console.log('\n⚠️  NOTE: You must manually deploy these rules:');
    console.log('1. Go to: https://console.firebase.google.com/project/binmokhtar2-967ad/firestore/rules');
    console.log('2. Copy the rules above');
    console.log('3. Paste into the Firebase Console');
    console.log('4. Click "Publish"');
    console.log('\nOR install firebase-tools correctly:');
    console.log('npm install -g firebase-tools');
    console.log('firebase deploy --only firestore:rules');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

deployRules()
  .then(() => {
    console.log('\n✅ Rules file read successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
