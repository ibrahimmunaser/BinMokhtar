// Check specific variant price
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

async function checkCoffeeSize56() {
  console.log('🔍 Checking Short Sleeve Thobe - Coffee, Size 56...\n');

  // Product ID for Short Sleeve Thobe - Coffee
  const productId = 'fr3qSiTLp9pN6CjYaHQE';
  
  const productRef = db.collection('products').doc(productId);
  const productSnap = await productRef.get();
  
  if (!productSnap.exists) {
    console.log('Product not found!');
    return;
  }
  
  const product = productSnap.data();
  console.log(`Product: ${product?.titleEn || product?.name}`);
  console.log(`Product.price: $${(product?.price || 0) / 100}`);
  console.log(`Product.basePrice: $${(product?.basePrice || 0) / 100}`);
  console.log('');
  
  // Get variants
  const variantsRef = productRef.collection('variants');
  const variantsSnap = await variantsRef.get();
  
  console.log(`Found ${variantsSnap.size} variants:\n`);
  
  variantsSnap.forEach(doc => {
    const variant = doc.data();
    console.log(`Size: ${variant.size}, Color: ${variant.color}`);
    console.log(`  Price: $${(variant.price || 0) / 100} (${variant.price} cents)`);
    console.log(`  Stock: ${variant.stock}`);
    console.log('');
  });
}

checkCoffeeSize56()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
