// Complete Firebase initialization with ALL collections
// Run this: npx tsx scripts/init-firebase-complete.ts

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load service account
const serviceAccountPath = path.join(process.cwd(), 'binmokhtar2-967ad-firebase-adminsdk-fbsvc-caad4a2ee6.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function initializeComplete() {
  console.log('🚀 Initializing Firebase with COMPLETE data structure...\n');

  // 1. CATEGORIES
  console.log('📦 Adding categories...');
  const categories = [
    { id: 'thobes', name: 'Thobes', slug: 'thobes', description: 'Traditional Islamic robes for men and boys', active: true, productCount: 0 },
    { id: 'shemaghs', name: 'Shemaghs', slug: 'shemaghs', description: 'Traditional head scarves', active: true, productCount: 0 },
    { id: 'shaals', name: 'Shaals', slug: 'shaals', description: 'Hand-woven traditional scarves', active: true, productCount: 0 },
    { id: 'kufis', name: 'Kufis', slug: 'kufis', description: 'Traditional prayer caps', active: true, productCount: 0 },
  ];
  for (const category of categories) {
    const { id, ...data } = category;
    await db.collection('categories').doc(id).set(data);
    console.log(`  ✅ ${category.name}`);
  }

  // 2. SETTINGS
  console.log('\n⚙️ Adding store settings...');
  await db.collection('settings').doc('store').set({
    name: 'Bin Mukhtar Retail',
    currency: 'USD',
    locales: ['en', 'ar'],
    taxPercent: 0,
    announcements: [
      { textEn: 'Free shipping on orders over $99', textAr: 'شحن مجاني للطلبات فوق 99 دولار', active: true }
    ],
    shippingRules: [
      { region: 'US', flatRate: 999, freeThreshold: 9900 },
      { region: 'International', flatRate: 2999, freeThreshold: 15000 }
    ],
    footerLinks: [
      { labelEn: 'About Us', labelAr: 'معلومات عنا', href: '/about' },
      { labelEn: 'Contact', labelAr: 'اتصل بنا', href: '/contact' },
      { labelEn: 'Size Guide', labelAr: 'دليل المقاسات', href: '/size-guide' }
    ],
    social: [
      { platform: 'instagram', url: 'https://instagram.com/binmukhtarretail' },
      { platform: 'facebook', url: 'https://facebook.com/binmukhtarretail' }
    ],
    storyBlocks: [
      {
        titleEn: 'Our Story',
        titleAr: 'قصتنا',
        bodyEn: 'Bin Mukhtar Retail brings you the finest luxury thobes, combining traditional craftsmanship with contemporary design.',
        bodyAr: 'يقدم لكم بن مختار ريتيل أفخر الثياب الفاخرة'
      }
    ],
    iconRow: [
      { iconName: 'Truck', labelEn: 'Worldwide Delivery', labelAr: 'توصيل عالمي' },
      { iconName: 'RefreshCw', labelEn: '14-Day Exchange', labelAr: 'استبدال ١٤ يوم' },
      { iconName: 'Heart', labelEn: 'Made with Care', labelAr: 'صنع بعناية' }
    ]
  });
  console.log('  ✅ Store settings');

  // 3. MENUS
  console.log('\n📋 Adding navigation menus...');
  await db.collection('menus').doc('header').set({
    items: [
      { labelEn: 'Shop', labelAr: 'متجر', href: '/shop', children: [] },
      { labelEn: 'Thobes', labelAr: 'ثوب', href: '/category/thobes', children: [] },
      { labelEn: 'Shemaghs', labelAr: 'شماغ', href: '/category/shemaghs', children: [] },
      { labelEn: 'About', labelAr: 'معلومات', href: '/about', children: [] }
    ]
  });
  await db.collection('menus').doc('footer').set({
    items: [
      { labelEn: 'Customer Service', labelAr: 'خدمة العملاء', href: '/contact', children: [] },
      { labelEn: 'Shipping & Returns', labelAr: 'الشحن والإرجاع', href: '/shipping-returns', children: [] },
      { labelEn: 'FAQ', labelAr: 'أسئلة شائعة', href: '/faq', children: [] }
    ]
  });
  console.log('  ✅ Header & Footer menus');

  // 4. HOME PAGE DATA
  console.log('\n🏠 Adding homepage content...');
  
  // Hero slides
  await db.collection('home').doc('hero').set({
    slides: [
      {
        type: 'image',
        src: '/placeholder.svg',
        titleEn: 'Luxury Thobes & Modest Fashion',
        titleAr: 'ثوب فاخر وأزياء محتشمة',
        subEn: 'Timeless elegance for every occasion',
        subAr: 'أناقة خالدة لكل مناسبة',
        ctaTextEn: 'Shop Now',
        ctaTextAr: 'تسوق الآن',
        href: '/shop'
      }
    ]
  });
  console.log('  ✅ Hero slides');

  // Mosaic grid
  await db.collection('home').doc('mosaic').set({
    tiles: [
      { titleEn: "Men's Thobes", titleAr: 'ثوب رجالي', href: '/category/thobes', image: '/placeholder.svg', span: { cols: 2, rows: 1 } },
      { titleEn: 'Shemaghs', titleAr: 'شماغ', href: '/category/shemaghs', image: '/placeholder.svg', span: { cols: 1, rows: 1 } },
      { titleEn: 'Kufis', titleAr: 'كوفي', href: '/category/kufis', image: '/placeholder.svg', span: { cols: 1, rows: 1 } }
    ]
  });
  console.log('  ✅ Category mosaic');

  // Shemagh tabs
  await db.collection('home').doc('shemaghTabs').set({
    tabs: [
      { slug: 'yemeni', labelEn: 'Yemeni Shemagh Scarves', labelAr: 'شماغ يمني', categoryFilter: 'SHAAL', tagFilter: 'yemeni' },
      { slug: 'saudi', labelEn: 'Saudi Shemagh Scarves', labelAr: 'شماغ سعودي', categoryFilter: 'SHAAL', tagFilter: 'saudi' },
      { slug: 'kufis', labelEn: 'Egyptian Kufis', labelAr: 'كوفي مصري', categoryFilter: 'KUFI' }
    ]
  });
  console.log('  ✅ Shemagh tabs');

  // 5. SAMPLE PRODUCTS
  console.log('\n📦 Adding sample products...');
  const products = [
    {
      slug: 'classic-white-thobe',
      name: 'Classic White Thobe',
      subtitle: 'Premium cotton blend with elegant drape',
      categoryId: 'thobes',
      price: 8900,
      compareAtPrice: 12900,
      colors: ['White', 'Cream'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      stock: 24,
      images: ['/placeholder.svg'],
      thumbnail: '/placeholder.svg',
      descriptionHtml: '<p>Our classic white thobe is crafted from premium cotton blend fabric.</p>',
      published: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      slug: 'luxury-black-thobe',
      name: 'Luxury Black Thobe',
      subtitle: 'Sophisticated evening wear',
      categoryId: 'thobes',
      price: 12900,
      colors: ['Black'],
      sizes: ['M', 'L', 'XL'],
      stock: 15,
      images: ['/placeholder.svg'],
      thumbnail: '/placeholder.svg',
      descriptionHtml: '<p>Elegant black thobe with slim fit design.</p>',
      published: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      slug: 'traditional-saudi-shemagh',
      name: 'Traditional Saudi Shemagh',
      subtitle: 'Authentic red and white pattern',
      categoryId: 'shemaghs',
      price: 3900,
      colors: ['Red/White'],
      sizes: ['One Size'],
      stock: 50,
      images: ['/placeholder.svg'],
      thumbnail: '/placeholder.svg',
      descriptionHtml: '<p>Authentic Saudi shemagh with traditional pattern.</p>',
      published: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];
  
  for (const product of products) {
    await db.collection('products').add(product);
    console.log(`  ✅ ${product.name}`);
  }

  // 6. SAMPLE REVIEWS
  console.log('\n⭐ Adding sample reviews...');
  const reviews = [
    {
      productId: 'product-1',
      rating: 5,
      title: 'Excellent Quality',
      body: 'The fabric is superb and the fit is perfect. Highly recommend!',
      name: 'Ahmed K.',
      approved: true,
      pinnedHome: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      productId: 'product-1',
      rating: 5,
      title: 'Perfect for Events',
      body: 'Wore it to a wedding and received many compliments.',
      name: 'Omar S.',
      approved: true,
      pinnedHome: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];
  
  for (const review of reviews) {
    await db.collection('reviews').add(review);
  }
  console.log('  ✅ 2 approved reviews');

  // 7. COLLECTIONS (Curated sets)
  console.log('\n🎨 Adding product collections...');
  await db.collection('collections').doc('matching').set({
    slug: 'matching',
    titleEn: 'Matching Collection',
    titleAr: 'مجموعة متناسقة',
    descriptionEn: 'Matching thobes for adults and children',
    descriptionAr: 'ثياب متناسقة للكبار والأطفال',
    productIds: [],
    heroImage: '/placeholder.svg',
    active: true
  });
  console.log('  ✅ Matching collection');

  // 8. PAGES
  console.log('\n📄 Adding content pages...');
  await db.collection('pages').doc('about').set({
    slug: 'about',
    titleEn: 'About Us',
    titleAr: 'معلومات عنا',
    bodyEn: 'Welcome to Bin Mukhtar Retail...',
    bodyAr: 'مرحبا بكم في بن مختار ريتيل...',
    published: true
  });
  console.log('  ✅ About page');

  console.log('\n✅ Complete Firebase initialization done!\n');
  console.log('📊 Collections created:');
  console.log('  ✅ categories (4 items)');
  console.log('  ✅ settings (store config)');
  console.log('  ✅ menus (header & footer)');
  console.log('  ✅ home (hero, mosaic, tabs)');
  console.log('  ✅ products (3 sample products)');
  console.log('  ✅ reviews (2 approved reviews)');
  console.log('  ✅ collections (1 curated set)');
  console.log('  ✅ pages (1 content page)');
  console.log('\n🚀 Your database is production-ready!');
  console.log('\n📋 Next steps:');
  console.log('1. Login to admin: http://localhost:3000/admin/login');
  console.log('2. Add more products through the admin panel');
  console.log('3. Check Firebase Console to see all collections');
  console.log('4. Visit shop page: http://localhost:3000/shop');
  
  process.exit(0);
}

initializeComplete().catch((error) => {
  console.error('❌ Error initializing Firebase:', error);
  process.exit(1);
});













