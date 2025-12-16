/**
 * Script to seed default subcategories into Firestore
 * Run with: npx ts-node scripts/seed-subcategories.ts
 * Or via: npm run seed:subcategories (after adding to package.json)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  const serviceAccountPath = path.join(__dirname, '..', 'binmokhtar2-967ad-firebase-adminsdk-fbsvc-a56edc343f.json');
  
  try {
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

const db = getFirestore();

// Default subcategories to seed
const defaultSubcategories = [
  // Men's subcategories
  {
    name: 'Emirati Thobes',
    slug: 'emirati',
    description: 'Emirati style thobes',
    parentCategoryId: 'Men',
    active: true,
    sort: 1,
  },
  {
    name: 'Saudi Thobes',
    slug: 'saudi',
    description: 'Saudi style thobes',
    parentCategoryId: 'Men',
    active: true,
    sort: 2,
  },
  // Women's subcategories
  {
    name: 'Hijabs',
    slug: 'hijabs',
    description: 'Elegant hijabs',
    parentCategoryId: 'Women',
    active: true,
    sort: 1,
  },
  {
    name: 'Abayas',
    slug: 'abayas',
    description: 'Traditional abayas',
    parentCategoryId: 'Women',
    active: true,
    sort: 2,
  },
  // Boys' subcategories
  {
    name: 'Emirati Thobes',
    slug: 'thobes',
    description: 'Boys Emirati thobes',
    parentCategoryId: 'Boys',
    active: true,
    sort: 1,
  },
  // Shemaghs subcategories
  {
    name: 'Traditional',
    slug: 'traditional',
    description: 'Traditional shemaghs',
    parentCategoryId: 'Shemaghs',
    active: true,
    sort: 1,
  },
  {
    name: 'Yemeni',
    slug: 'yemeni',
    description: 'Yemeni style shemaghs',
    parentCategoryId: 'Shemaghs',
    active: true,
    sort: 2,
  },
];

async function seedSubcategories() {
  console.log('Starting subcategory seeding...\n');
  
  const subcategoriesRef = db.collection('subcategories');
  
  // Check existing subcategories
  const existingSnapshot = await subcategoriesRef.get();
  const existingSlugs = new Set(existingSnapshot.docs.map(doc => doc.data().slug));
  
  console.log(`Found ${existingSnapshot.size} existing subcategories`);
  
  let added = 0;
  let skipped = 0;
  
  for (const subcategory of defaultSubcategories) {
    if (existingSlugs.has(subcategory.slug)) {
      console.log(`⏭️  Skipping "${subcategory.name}" (${subcategory.parentCategoryId}) - already exists`);
      skipped++;
      continue;
    }
    
    const data = {
      ...subcategory,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await subcategoriesRef.add(data);
    console.log(`✅ Added "${subcategory.name}" under ${subcategory.parentCategoryId}`);
    added++;
  }
  
  console.log(`\n✨ Seeding complete!`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
}

// Run the seed function
seedSubcategories()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding subcategories:', error);
    process.exit(1);
  });

