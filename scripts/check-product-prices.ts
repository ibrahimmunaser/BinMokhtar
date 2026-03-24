// Script to check and fix product-level prices (not just variants)
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

async function checkProductLevelPrices() {
  console.log('🔍 Checking PRODUCT-LEVEL prices (not variants)...\n');

  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  const issues: any[] = [];
  const MAX_REASONABLE_PRICE = 50000; // $500

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const productName = product.titleEn || product.name || 'Unnamed';
    
    // Check product.price field
    const productPrice = product.price || 0;
    const basePrice = product.basePrice || 0;
    
    console.log(`📦 ${productName}`);
    console.log(`   Product ID: ${doc.id}`);
    console.log(`   product.price: ${productPrice ? `$${productPrice / 100}` : 'not set'}`);
    console.log(`   product.basePrice: ${basePrice ? `$${basePrice / 100}` : 'not set'}`);
    
    if (productPrice > MAX_REASONABLE_PRICE) {
      console.log(`   ❌ ISSUE: product.price is too high!`);
      issues.push({
        productId: doc.id,
        productName,
        field: 'price',
        currentValue: productPrice,
      });
    }
    
    if (basePrice > MAX_REASONABLE_PRICE) {
      console.log(`   ❌ ISSUE: product.basePrice is too high!`);
      issues.push({
        productId: doc.id,
        productName,
        field: 'basePrice',
        currentValue: basePrice,
      });
    }
    
    console.log('');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Issues found: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  PRODUCTS WITH INCORRECT PRICES:');
    issues.forEach(issue => {
      console.log(`   - ${issue.productName}: ${issue.field} = $${issue.currentValue / 100}`);
    });
  } else {
    console.log('\n✅ All product-level prices are correct!');
  }

  return issues;
}

checkProductLevelPrices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
