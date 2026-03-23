/**
 * Test Shipping Rates Script
 * 
 * This script tests the shipping rate API with the Los Angeles address
 * to verify that both USPS and UPS rates are returned correctly.
 * 
 * Usage: npx tsx scripts/test-shipping-rates.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { getShippingRates } from '../lib/shipping/shippo';
import type { LocationZone, ShippingCartItem } from '../lib/shipping/config';

// Test address - Los Angeles (exactly as provided)
const TEST_ADDRESS: LocationZone = {
  street: '1111 S Figueroa St',
  city: 'Los Angeles',
  state: 'CA',
  zip: '90015',
  country: 'US',
  lat: 34.0407,
  lng: -118.2670,
  formattedAddress: '1111 S Figueroa St, Los Angeles, CA 90015',
  distanceMiles: 1950,
  zone: 'shippo',
  source: 'manual',
};

// Test cart items (minimal product for testing)
const TEST_ITEMS: ShippingCartItem[] = [
  {
    productId: 'test-product-1',
    variantId: 'test-variant-1',
    sku: 'TEST-SKU-001',
    name: 'Test Product',
    qty: 1,
    weight: 8, // 8 oz (0.5 lbs)
  },
];

async function testShippingRates() {
  console.log('🚚 SHIPPING RATES TEST\n');
  console.log('=' .repeat(60));
  console.log('\n📍 TEST ADDRESS:');
  console.log(`   Street: ${TEST_ADDRESS.street}`);
  console.log(`   City: ${TEST_ADDRESS.city}`);
  console.log(`   State: ${TEST_ADDRESS.state}`);
  console.log(`   Zip: ${TEST_ADDRESS.zip}`);
  console.log(`   Country: ${TEST_ADDRESS.country}`);
  
  console.log('\n📦 TEST ITEMS:');
  TEST_ITEMS.forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item.name}`);
    console.log(`      SKU: ${item.sku}`);
    console.log(`      Qty: ${item.qty}`);
    console.log(`      Weight: ${item.weight} oz`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n🔄 Fetching shipping rates from Shippo...\n');

  try {
    // Fetch rates
    const startTime = Date.now();
    const rates = await getShippingRates(TEST_ADDRESS, TEST_ITEMS);
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SHIPPING RATES RETRIEVED\n');
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📊 Total rates found: ${rates.length}`);

    if (rates.length === 0) {
      console.log('\n❌ NO SHIPPING RATES FOUND!');
      console.log('\n🔍 Possible reasons:');
      console.log('   1. Shippo API token is invalid or not in live mode');
      console.log('   2. No carriers are activated in Shippo dashboard');
      console.log('   3. Address is not serviceable');
      console.log('   4. Shippo API error occurred');
      console.log('\n💡 Check the logs above for error messages.');
      return;
    }

    // Analyze rates by carrier
    const uspsRates = rates.filter(r => r.carrier.toLowerCase() === 'usps');
    const upsRates = rates.filter(r => r.carrier.toLowerCase() === 'ups');
    const otherRates = rates.filter(r => 
      r.carrier.toLowerCase() !== 'usps' && 
      r.carrier.toLowerCase() !== 'ups'
    );

    console.log('\n📊 RATES BY CARRIER:');
    console.log(`   USPS: ${uspsRates.length} rate(s)`);
    console.log(`   UPS:  ${upsRates.length} rate(s)`);
    if (otherRates.length > 0) {
      console.log(`   Other: ${otherRates.length} rate(s)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 DETAILED RATE BREAKDOWN:\n');

    // Display all rates in order
    rates.forEach((rate, idx) => {
      console.log(`${idx + 1}. ${rate.carrier.toUpperCase()} - ${rate.serviceLevelName}`);
      console.log(`   Price: $${(rate.amount / 100).toFixed(2)}`);
      console.log(`   Rate ID: ${rate.id}`);
      console.log(`   Service Token: ${rate.serviceLevelToken}`);
      if (rate.estimatedDays) {
        console.log(`   Delivery: ${rate.estimatedDays} business day${rate.estimatedDays > 1 ? 's' : ''}`);
      }
      if (rate.durationTerms) {
        console.log(`   Duration: ${rate.durationTerms}`);
      }
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n🎯 TEST RESULTS:\n');

    // Check for USPS
    if (uspsRates.length > 0) {
      console.log('✅ USPS rates are showing');
      console.log(`   Services: ${uspsRates.map(r => r.serviceLevelName).join(', ')}`);
    } else {
      console.log('❌ USPS rates are NOT showing');
    }

    // Check for UPS (CRITICAL TEST)
    if (upsRates.length > 0) {
      console.log('✅ UPS rates are showing (FIX IS WORKING!)');
      console.log(`   Services: ${upsRates.map(r => r.serviceLevelName).join(', ')}`);
    } else {
      console.log('❌ UPS rates are NOT showing (ISSUE DETECTED!)');
      console.log('\n🔍 Possible reasons:');
      console.log('   1. UPS carrier not activated in Shippo dashboard');
      console.log('   2. UPS account in test mode (not live mode)');
      console.log('   3. UPS does not service this address');
      console.log('   4. Shippo filtering logic is excluding UPS');
      console.log('\n💡 Next steps:');
      console.log('   1. Go to https://app.goshippo.com');
      console.log('   2. Navigate to Settings → Carriers');
      console.log('   3. Verify UPS carrier shows "Active" status (not "Test")');
      console.log('   4. Check that you\'re in LIVE mode (not test mode)');
    }

    // Check for cheapest option
    const cheapestRate = rates.reduce((min, rate) => 
      rate.amount < min.amount ? rate : min
    );
    console.log(`\n💰 Cheapest option: ${cheapestRate.carrier.toUpperCase()} ${cheapestRate.serviceLevelName} - $${(cheapestRate.amount / 100).toFixed(2)}`);

    // Overall status
    console.log('\n' + '='.repeat(60));
    if (upsRates.length > 0 && uspsRates.length > 0) {
      console.log('\n🎉 SUCCESS! Both USPS and UPS rates are available.');
      console.log('✅ Customers will see multiple shipping options at checkout.');
    } else if (uspsRates.length > 0 && upsRates.length === 0) {
      console.log('\n⚠️  PARTIAL SUCCESS - Only USPS rates showing.');
      console.log('❌ UPS activation required - see instructions above.');
    } else if (uspsRates.length === 0 && upsRates.length > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS - Only UPS rates showing.');
      console.log('❌ USPS carrier may need attention.');
    } else {
      console.log('\n❌ FAILURE - No expected carriers found.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📝 CHECKOUT SIMULATION:\n');
    console.log('If a customer proceeds to checkout with this address,');
    console.log('they will see these shipping options in order:\n');
    
    rates.forEach((rate, idx) => {
      const icon = rate.carrier.toLowerCase() === 'usps' ? '📮' : 
                   rate.carrier.toLowerCase() === 'ups' ? '📦' : '🚚';
      console.log(`${icon} ${rate.carrier.toUpperCase()} ${rate.serviceLevelName}`);
      console.log(`   $${(rate.amount / 100).toFixed(2)}${rate.estimatedDays ? ` • ${rate.estimatedDays} day${rate.estimatedDays > 1 ? 's' : ''}` : ''}`);
      console.log('');
    });

    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ ERROR FETCHING SHIPPING RATES:\n');
    console.error('Error message:', error.message);
    console.error('\nFull error:', error);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 TROUBLESHOOTING:\n');
    
    if (error.message?.includes('SHIPPO_API_TOKEN')) {
      console.log('❌ Shippo API token not configured');
      console.log('   Check your .env.local file');
      console.log('   Ensure SHIPPO_API_TOKEN is set');
    } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.log('❌ Authentication failed');
      console.log('   Verify your Shippo API token is correct');
      console.log('   Ensure it starts with "shippo_live_" for production');
    } else if (error.message?.includes('404')) {
      console.log('❌ Shippo API endpoint not found');
      console.log('   Check Shippo API version compatibility');
    } else if (error.message?.includes('timeout')) {
      console.log('❌ Request timed out');
      console.log('   Shippo API may be slow or unreachable');
      console.log('   Try again in a few moments');
    } else {
      console.log('❌ Unexpected error occurred');
      console.log('   Check server logs for more details');
      console.log('   Verify Shippo service is operational');
    }
    
    console.log('\n💡 Additional checks:');
    console.log('   1. Verify SHIPPO_API_TOKEN in .env.local');
    console.log('   2. Check Shippo dashboard: https://app.goshippo.com');
    console.log('   3. Ensure carriers are activated');
    console.log('   4. Verify account is in live mode (not test mode)');
    
    throw error;
  }
}

// Run the test
console.log('\n🚀 Starting Shipping Rates Test...\n');
testShippingRates()
  .then(() => {
    console.log('\n✨ Test completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n💥 Test failed\n');
    process.exit(1);
  });
