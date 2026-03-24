// Comprehensive price validation script
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '', 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const MAX_REASONABLE_PRICE = 50000; // $500

async function comprehensivePriceTest() {
  console.log('🔍 COMPREHENSIVE PRICE CONSISTENCY TEST\n');
  console.log('='.repeat(60));
  
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  const priceStats = {
    totalProducts: 0,
    totalVariants: 0,
    correctPrices: 0,
    incorrectPrices: 0,
    priceDistribution: {} as Record<number, number>,
  };

  const issues: string[] = [];

  console.log('\n📦 SCANNING DATABASE...\n');

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const productName = product.titleEn || product.name || 'Unnamed';
    const productPrice = product.price || product.basePrice || 0;

    priceStats.totalProducts++;

    // Check main product price
    if (productPrice > MAX_REASONABLE_PRICE) {
      issues.push(`❌ Product "${productName}" has unrealistic price: $${productPrice / 100}`);
      priceStats.incorrectPrices++;
    } else {
      priceStats.correctPrices++;
      const priceKey = Math.round(productPrice / 100);
      priceStats.priceDistribution[priceKey] = (priceStats.priceDistribution[priceKey] || 0) + 1;
    }

    // Check variants
    const variantsRef = productsRef.doc(doc.id).collection('variants');
    const variantsSnapshot = await variantsRef.get();

    for (const variantDoc of variantsSnapshot.docs) {
      const variant = variantDoc.data();
      const variantPrice = variant.price || 0;

      priceStats.totalVariants++;

      if (variantPrice > MAX_REASONABLE_PRICE) {
        issues.push(`❌ Variant "${productName}" (Size ${variant.size}, Color ${variant.color}) has unrealistic price: $${variantPrice / 100}`);
        priceStats.incorrectPrices++;
      } else {
        priceStats.correctPrices++;
        const priceKey = Math.round(variantPrice / 100);
        priceStats.priceDistribution[priceKey] = (priceStats.priceDistribution[priceKey] || 0) + 1;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE SCAN RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Products: ${priceStats.totalProducts}`);
  console.log(`Total Variants: ${priceStats.totalVariants}`);
  console.log(`Correct Prices: ${priceStats.correctPrices} ✅`);
  console.log(`Incorrect Prices: ${priceStats.incorrectPrices} ❌`);

  console.log('\n💰 PRICE DISTRIBUTION:');
  const sortedPrices = Object.keys(priceStats.priceDistribution)
    .map(Number)
    .sort((a, b) => a - b);

  sortedPrices.forEach(price => {
    const count = priceStats.priceDistribution[price];
    const bar = '█'.repeat(Math.min(count, 50));
    console.log(`  $${price.toFixed(2)}: ${bar} (${count})`);
  });

  if (issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('\n✅ ALL PRICES ARE CORRECT!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 EXPECTED PRICES (for reference):');
  console.log('='.repeat(60));
  console.log('  Traditional Shemagh: $8.99');
  console.log('  Short Sleeve Thobe: $19.99');
  console.log('  Kids Thobe: $19.99');
  console.log('  Lightweight Emirati: $25.49');
  console.log('  Moroccan Gandoura: $37.99');
  console.log('  Saudi Thobe: $39.99');

  console.log('\n' + '='.repeat(60));
  
  if (priceStats.incorrectPrices === 0) {
    console.log('✅ DATABASE PRICE TEST: PASSED');
  } else {
    console.log('❌ DATABASE PRICE TEST: FAILED');
  }
  
  console.log('='.repeat(60) + '\n');

  return priceStats.incorrectPrices === 0;
}

comprehensivePriceTest()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
