// Quick script to add initial data to Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC-pld1QWX7K2OYRiXYMbwQtaBtmGSj6EA",
  authDomain: "binmokhtar2-967ad.firebaseapp.com",
  projectId: "binmokhtar2-967ad",
  storageBucket: "binmokhtar2-967ad.firebasestorage.app",
  messagingSenderId: "1060602772979",
  appId: "1:1060602772979:web:af5df416d0b296551ea686",
  measurementId: "G-DN9ZE73RX4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  console.log('🌱 Seeding Firestore with initial data...\n');

  try {
    // 1. Header Settings
    console.log('Adding header settings...');
    await setDoc(doc(db, 'settings', 'header'), {
      reviewsLine: "Premium Traditional Attire",
      shippingLine: "Free shipping over $99"
    });
    console.log('✅ Header settings added\n');

    // 2. Home Settings
    console.log('Adding home settings...');
    await setDoc(doc(db, 'settings', 'home'), {
      heroHeadline: "Timeless Elegance in Traditional Attire",
      heroSub: "Discover premium thobes and shaals crafted with excellence",
      heroCtaLabel: "Shop Thobes",
      heroCtaHref: "/shop",
      usp: [
        "Free shipping over $99",
        "Easy 30-day returns",
        "Premium tailoring"
      ],
      featuredCategoryIds: [],
      featuredProductIds: []
    });
    console.log('✅ Home settings added\n');

    // 3. Sample Navigation Items
    console.log('Adding navigation items...');
    
    await addDoc(collection(db, 'navigation'), {
      label: "Shop",
      href: "/shop",
      position: "primary"
    });

    await addDoc(collection(db, 'navigation'), {
      label: "Men",
      position: "primary",
      children: [
        { id: "men-signature", label: "Signature Thobes", href: "/category/men-signature" },
        { id: "men-omani", label: "Omani Style", href: "/category/men-omani" },
        { id: "men-emirati", label: "Emirati Style", href: "/category/men-emirati" }
      ]
    });

    await addDoc(collection(db, 'navigation'), {
      label: "About",
      href: "/about",
      position: "utility"
    });

    await addDoc(collection(db, 'navigation'), {
      label: "Contact",
      href: "/contact",
      position: "utility"
    });

    console.log('✅ Navigation items added\n');

    // 4. Sample Category
    console.log('Adding sample category...');
    const categoryRef = await addDoc(collection(db, 'categories'), {
      name: "Men's Thobes",
      slug: "men-thobes",
      sort: 1,
      active: true,
      description: "Premium thobes for men"
    });
    console.log('✅ Sample category added\n');

    // 5. Sample Product
    console.log('Adding sample product...');
    await addDoc(collection(db, 'products'), {
      name: "Classic White Thobe",
      slug: "classic-white-thobe",
      subtitle: "Timeless elegance for every occasion",
      categoryId: categoryRef.id,
      price: 12900, // $129.00
      compareAtPrice: 15900, // $159.00
      colors: ["white", "black"],
      sizes: ["52", "54", "56", "58", "60"],
      stock: 50,
      images: [
        "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=600&h=800&fit=crop",
      ],
      thumbnail: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=600&h=800&fit=crop",
      descriptionHtml: "<p>Premium cotton thobe with traditional cut and modern comfort. Perfect for daily wear and special occasions.</p>",
      fabricHtml: "<p>100% Egyptian cotton. Machine washable. Iron on low heat.</p>",
      badges: ["New Arrival"],
      published: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Sample product added\n');

    console.log('🎉 SUCCESS! Your Firestore is now populated with initial data.\n');
    console.log('Refresh your browser at http://localhost:3000\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();

