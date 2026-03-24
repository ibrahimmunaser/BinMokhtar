// Script to find and fix products with incorrect prices in Firestore
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

async function findAndFixIncorrectPrices() {
  console.log('🔍 Scanning all products for incorrect prices...\n');

  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  const issues: any[] = [];
  const MAX_REASONABLE_PRICE = 50000; // $500 in cents

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const productId = doc.id;
    const productName = product.titleEn || product.name || 'Unnamed Product';

    // Check main product price
    const price = product.price || product.basePrice || 0;
    
    if (price > MAX_REASONABLE_PRICE) {
      console.log(`❌ FOUND ISSUE: ${productName}`);
      console.log(`   Product ID: ${productId}`);
      console.log(`   Current Price: $${price / 100} (${price} cents)`);
      console.log(`   Expected Range: $8.99 - $50.00`);
      
      issues.push({
        productId,
        productName,
        currentPrice: price,
        type: 'main_product',
      });
    }

    // Check variants
    const variantsRef = productsRef.doc(productId).collection('variants');
    const variantsSnapshot = await variantsRef.get();

    for (const variantDoc of variantsSnapshot.docs) {
      const variant = variantDoc.data();
      const variantPrice = variant.price || 0;

      if (variantPrice > MAX_REASONABLE_PRICE) {
        console.log(`❌ FOUND ISSUE IN VARIANT: ${productName}`);
        console.log(`   Product ID: ${productId}`);
        console.log(`   Variant ID: ${variantDoc.id}`);
        console.log(`   Size: ${variant.size}, Color: ${variant.color}`);
        console.log(`   Current Price: $${variantPrice / 100} (${variantPrice} cents)`);
        
        issues.push({
          productId,
          variantId: variantDoc.id,
          productName,
          currentPrice: variantPrice,
          size: variant.size,
          color: variant.color,
          type: 'variant',
        });
      }
    }
  }

  console.log(`\n📊 SCAN COMPLETE`);
  console.log(`Total products scanned: ${snapshot.size}`);
  console.log(`Issues found: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('✅ No pricing issues found!');
    return;
  }

  console.log('🔧 Would you like to fix these issues? (Y/N)');
  console.log('\nIssues to fix:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.productName} - Current: $${issue.currentPrice / 100}`);
    if (issue.type === 'variant') {
      console.log(`   Variant: Size ${issue.size}, Color ${issue.color}`);
    }
  });

  // For now, just report - don't auto-fix
  console.log('\n⚠️  Manual review recommended before fixing.');
  console.log('Most likely fix: Check if price should be divided by 100');
  console.log('Example: 299900 cents ($2999) → 2999 cents ($29.99)');

  return issues;
}

findAndFixIncorrectPrices()
  .then((issues) => {
    if (issues && issues.length > 0) {
      console.log('\n📋 COPY THIS TO SHARE:');
      console.log(JSON.stringify(issues, null, 2));
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
