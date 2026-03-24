// Fix Coffee Thobe variant prices
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

async function fixCoffeeVariants() {
  console.log('🔧 Fixing Coffee Thobe variants...\n');

  const productId = 'fr3qSiTLp9pN6CjYaHQE';
  const CORRECT_PRICE = 1999; // $19.99 in cents
  
  const variantsRef = db.collection('products').doc(productId).collection('variants');
  const variantsSnap = await variantsRef.get();
  
  let fixedCount = 0;
  
  for (const doc of variantsSnap.docs) {
    const variant = doc.data();
    const currentPrice = variant.price || 0;
    
    if (currentPrice !== CORRECT_PRICE) {
      console.log(`✅ Fixing Size ${variant.size}, Color ${variant.color}`);
      console.log(`   Old: $${currentPrice / 100} (${currentPrice} cents)`);
      console.log(`   New: $${CORRECT_PRICE / 100} (${CORRECT_PRICE} cents)\n`);
      
      await variantsRef.doc(doc.id).update({
        price: CORRECT_PRICE,
      });
      
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} variants!`);
  console.log('All Coffee Thobe variants now cost $19.99');
}

fixCoffeeVariants()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
