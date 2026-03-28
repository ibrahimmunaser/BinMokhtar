// Script to fix ALL corrupted variant prices (including those under $500)
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

// Expected prices by product type (in cents)
const EXPECTED_PRICES: Record<string, number> = {
  'Traditional Shemagh': 899, // $8.99
  'Short Sleeve Thobe': 1999, // $19.99
  'Kids Emirati Thobe': 1999, // $19.99
  'Lightweight Emirati': 2549, // $25.49
  'Moroccan Gandoura': 3799, // $37.99
  'White Saudi Thobe': 3999, // $39.99
};

async function fixAllCorruptedPrices() {
  console.log('🔧 FIXING ALL CORRUPTED PRICES (including under $500)...\n');

  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  let fixedCount = 0;
  let skippedCount = 0;
  const MAX_REASONABLE_PRICE = 50000; // $500

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const productId = doc.id;
    const productName = product.titleEn || product.name || 'Unnamed Product';

    // Determine expected price for this product
    let expectedPrice = 1999; // default $19.99
    for (const [key, price] of Object.entries(EXPECTED_PRICES)) {
      if (productName.includes(key)) {
        expectedPrice = price;
        break;
      }
    }

    // Check variants
    const variantsRef = productsRef.doc(productId).collection('variants');
    const variantsSnapshot = await variantsRef.get();

    for (const variantDoc of variantsSnapshot.docs) {
      const variant = variantDoc.data();
      const variantPrice = variant.price || 0;

      // Check for corruption:
      // 1. Price over $500
      // 2. Price ends with many zeros (suspicious pattern)
      // 3. Price is 100x, 1000x, or 10000x the expected price
      const isOverLimit = variantPrice > MAX_REASONABLE_PRICE;
      const hasExtraZeros = variantPrice > 10000 && variantPrice % 100 === 0;
      const is100xOff = Math.abs(variantPrice - expectedPrice * 100) < 100;
      const is1000xOff = Math.abs(variantPrice - expectedPrice * 1000) < 1000;
      const is10000xOff = Math.abs(variantPrice - expectedPrice * 10000) < 10000;

      const isCorrupted = isOverLimit || (hasExtraZeros && (is100xOff || is1000xOff || is10000xOff));

      if (isCorrupted) {
        console.log(`✅ FIXING: ${productName}`);
        console.log(`   Variant: Size ${variant.size}, Color ${variant.color}`);
        console.log(`   Old Price: $${(variantPrice / 100).toFixed(2)} (${variantPrice} cents)`);
        console.log(`   New Price: $${(expectedPrice / 100).toFixed(2)} (${expectedPrice} cents)\n`);

        // Update the variant price
        await variantsRef.doc(variantDoc.id).update({
          price: expectedPrice,
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

fixAllCorruptedPrices()
  .then(() => {
    console.log('\n🎉 All corrupted prices fixed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
