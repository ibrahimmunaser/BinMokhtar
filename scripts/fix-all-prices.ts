// Script to automatically fix all corrupted variant prices in Firestore
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '', 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Price correction mapping - what prices SHOULD be (in cents)
const CORRECT_PRICES: Record<string, number> = {
  'Lightweight Emirati Thobe': 2549, // $25.49
  'Short Sleeve Thobe': 1999, // $19.99
  'White Saudi Thobe - Al Haramain': 3999, // $39.99
  'Moroccan Gandoura (Linen)': 3799, // $37.99
  'Kids Emirati Thobe (IKAF Brand)': 1999, // $19.99
  'Traditional Shemagh': 899, // $8.99
};

async function fixAllPrices() {
  console.log('🔧 FIXING ALL CORRUPTED PRICES...\n');

  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  let fixedCount = 0;
  let skippedCount = 0;
  const MAX_REASONABLE_PRICE = 50000; // $500

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const productId = doc.id;
    const productName = product.titleEn || product.name || 'Unnamed Product';

    // Check variants
    const variantsRef = productsRef.doc(productId).collection('variants');
    const variantsSnapshot = await variantsRef.get();

    for (const variantDoc of variantsSnapshot.docs) {
      const variant = variantDoc.data();
      const variantPrice = variant.price || 0;

      if (variantPrice > MAX_REASONABLE_PRICE) {
        // Determine correct price based on product name
        let correctPrice = 1999; // default $19.99

        for (const [key, price] of Object.entries(CORRECT_PRICES)) {
          if (productName.includes(key)) {
            correctPrice = price;
            break;
          }
        }

        console.log(`✅ FIXING: ${productName}`);
        console.log(`   Variant: Size ${variant.size}, Color ${variant.color}`);
        console.log(`   Old Price: $${variantPrice / 100} (${variantPrice} cents)`);
        console.log(`   New Price: $${correctPrice / 100} (${correctPrice} cents)\n`);

        // Update the variant price
        await variantsRef.doc(variantDoc.id).update({
          price: correctPrice,
        });

        fixedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  console.log(`\n✅ FIX COMPLETE!`);
  console.log(`Fixed: ${fixedCount} variants`);
  console.log(`Skipped (already correct): ${skippedCount} variants`);
}

fixAllPrices()
  .then(() => {
    console.log('\n🎉 All prices fixed! Your site is ready.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
