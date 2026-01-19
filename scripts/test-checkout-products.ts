/**
 * Test Checkout Products Script
 * 
 * This script validates that all products have the required data for checkout.
 * Run this to find products that might cause checkout errors.
 * 
 * Usage: npx tsx scripts/test-checkout-products.ts
 */

import 'dotenv/config';
import { adminDb } from '../lib/firebase/server';

async function testCheckoutProducts() {
  console.log('🔍 Testing products for checkout compatibility...\n');

  try {
    const db = adminDb();
    
    // Get all active products
    const productsSnapshot = await db.collection('products')
      .where('status', '==', 'ACTIVE')
      .get();

    console.log(`📦 Found ${productsSnapshot.size} active products\n`);

    const issues: string[] = [];
    let validCount = 0;

    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;
      const title = product.titleEn || product.titleAr || 'Unnamed Product';

      console.log(`\n📋 Checking: ${title}`);
      console.log(`   ID: ${productId}`);

      // Check base price
      const basePrice = product.basePrice || product.price || 0;
      if (!basePrice || basePrice <= 0) {
        issues.push(`❌ ${title}: Invalid base price (${basePrice})`);
        console.log(`   ❌ Base price: ${basePrice} (INVALID)`);
      } else {
        console.log(`   ✅ Base price: $${(basePrice / 100).toFixed(2)}`);
      }

      // Check SKU
      if (!product.sku) {
        issues.push(`⚠️  ${title}: Missing SKU`);
        console.log(`   ⚠️  SKU: Missing`);
      } else {
        console.log(`   ✅ SKU: ${product.sku}`);
      }

      // Check variants
      const variantsSnapshot = await db.collection('products')
        .doc(productId)
        .collection('variants')
        .get();

      if (variantsSnapshot.empty) {
        console.log(`   ⚠️  No variants found`);
      } else {
        console.log(`   📦 ${variantsSnapshot.size} variants found`);
        
        let variantIssues = 0;
        for (const variantDoc of variantsSnapshot.docs) {
          const variant = variantDoc.data();
          const variantPrice = variant.price || basePrice;
          const variantSKU = variant.sku;
          const variantStock = variant.stock || 0;
          const variantDesc = [variant.size, variant.color].filter(Boolean).join(' / ') || variantDoc.id;

          if (!variantPrice || variantPrice <= 0) {
            issues.push(`❌ ${title} (${variantDesc}): Invalid price (${variantPrice})`);
            console.log(`      ❌ ${variantDesc}: Price ${variantPrice} (INVALID)`);
            variantIssues++;
          }

          if (!variantSKU) {
            issues.push(`⚠️  ${title} (${variantDesc}): Missing SKU`);
            console.log(`      ⚠️  ${variantDesc}: Missing SKU`);
            variantIssues++;
          }

          if (variantStock <= 0) {
            console.log(`      ⚠️  ${variantDesc}: Out of stock (${variantStock})`);
          }
        }

        if (variantIssues === 0) {
          console.log(`   ✅ All variants valid`);
        }
      }

      if (issues.length === 0 || !issues.some(i => i.includes(title) && i.includes('❌'))) {
        validCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY\n');
    console.log(`✅ Valid products: ${validCount}/${productsSnapshot.size}`);
    console.log(`❌ Products with issues: ${productsSnapshot.size - validCount}`);

    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:\n');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('\n💡 Fix these issues before customers can checkout successfully.\n');
    } else {
      console.log('\n🎉 All products are valid for checkout!\n');
    }

  } catch (error) {
    console.error('❌ Error testing products:', error);
    throw error;
  }
}

// Run the script
testCheckoutProducts()
  .then(() => {
    console.log('✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
