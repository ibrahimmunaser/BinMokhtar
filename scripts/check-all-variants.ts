// Comprehensive check of ALL products and ALL variants
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

// Expected prices for each product type
const EXPECTED_PRICES: Record<string, number> = {
  'Traditional Shemagh': 899,      // $8.99
  'Short Sleeve Thobe': 1999,       // $19.99
  'Kids Emirati Thobe': 1999,       // $19.99
  'Lightweight Emirati': 2549,      // $25.49
  'Moroccan Gandoura': 3799,        // $37.99
  'White Saudi Thobe': 3999,        // $39.99
};

async function checkAllProductsAndVariants() {
  console.log('🔍 COMPREHENSIVE CHECK - ALL PRODUCTS AND VARIANTS\n');
  console.log('='.repeat(80));
  
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  const issues: any[] = [];
  let totalVariants = 0;
  let corruptedVariants = 0;

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const productName = product.titleEn || product.name || 'Unnamed';
    
    console.log(`\n📦 ${productName}`);
    console.log(`   Product ID: ${doc.id}`);
    console.log(`   Product Price: $${(product.price || 0) / 100}`);
    
    // Get variants
    const variantsRef = productsRef.doc(doc.id).collection('variants');
    const variantsSnapshot = await variantsRef.get();
    
    if (variantsSnapshot.size === 0) {
      console.log(`   ⚠️  No variants found`);
      continue;
    }
    
    console.log(`   Variants: ${variantsSnapshot.size}`);
    
    // Determine expected price for this product
    let expectedPrice = product.price || 0;
    for (const [key, price] of Object.entries(EXPECTED_PRICES)) {
      if (productName.includes(key)) {
        expectedPrice = price;
        break;
      }
    }
    
    let productHasIssues = false;
    
    for (const variantDoc of variantsSnapshot.docs) {
      const variant = variantDoc.data();
      const variantPrice = variant.price || 0;
      totalVariants++;
      
      // Check for corruption patterns:
      // 1. Price over $500 (50000 cents)
      // 2. Price has suspicious pattern (ends in many zeros)
      // 3. Price is 100x, 1000x, or 10000x expected
      
      const isOverLimit = variantPrice > 50000;
      const hasExtraZeros = variantPrice > 10000 && variantPrice % 100 === 0;
      const is100xOff = Math.abs(variantPrice - expectedPrice * 100) < 100;
      const is1000xOff = Math.abs(variantPrice - expectedPrice * 1000) < 1000;
      const is10000xOff = Math.abs(variantPrice - expectedPrice * 10000) < 10000;
      
      if (isOverLimit || (hasExtraZeros && (is100xOff || is1000xOff || is10000xOff))) {
        if (!productHasIssues) {
          console.log(`   ❌ CORRUPTED VARIANTS:`);
          productHasIssues = true;
        }
        
        console.log(`      Size: ${variant.size}, Color: ${variant.color}`);
        console.log(`      Current: $${variantPrice / 100} (${variantPrice} cents)`);
        console.log(`      Expected: $${expectedPrice / 100} (${expectedPrice} cents)`);
        
        issues.push({
          productId: doc.id,
          productName,
          variantId: variantDoc.id,
          size: variant.size,
          color: variant.color,
          currentPrice: variantPrice,
          expectedPrice: expectedPrice,
        });
        
        corruptedVariants++;
      }
    }
    
    if (!productHasIssues) {
      console.log(`   ✅ All variants OK`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Products: ${snapshot.size}`);
  console.log(`Total Variants: ${totalVariants}`);
  console.log(`Corrupted Variants: ${corruptedVariants}`);
  console.log(`Clean Variants: ${totalVariants - corruptedVariants}`);
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    console.log('='.repeat(80));
    
    // Group by product
    const byProduct = issues.reduce((acc: any, issue: any) => {
      if (!acc[issue.productName]) {
        acc[issue.productName] = [];
      }
      acc[issue.productName].push(issue);
      return acc;
    }, {});
    
    for (const [productName, productIssues] of Object.entries(byProduct)) {
      console.log(`\n${productName}: ${(productIssues as any).length} corrupted variants`);
      (productIssues as any).forEach((issue: any) => {
        console.log(`  - Size ${issue.size}, Color ${issue.color}: $${issue.currentPrice / 100} → $${issue.expectedPrice / 100}`);
      });
    }
  } else {
    console.log('\n✅ ALL VARIANTS ARE CORRECT!');
  }
  
  return issues;
}

checkAllProductsAndVariants()
  .then((issues) => {
    if (issues.length === 0) {
      console.log('\n🎉 Database is 100% clean!');
    } else {
      console.log(`\n⚠️  Found ${issues.length} variants that need fixing`);
    }
    process.exit(issues.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
