/**
 * Firebase Storage Image Helper
 * 
 * Use this to generate Firebase Storage URLs for images
 */

const FIREBASE_STORAGE_BASE = 'https://storage.googleapis.com/binmokhtar2-967ad.firebasestorage.app';

/**
 * Get Firebase Storage URL for an image path
 * 
 * @param path - Path to image (e.g., 'images/hero.png' or '/images/hero.png')
 * @returns Full Firebase Storage URL
 * 
 * @example
 * getFirebaseImageUrl('/images/hero.png')
 * // Returns: 'https://storage.googleapis.com/binmokhtar2-967ad.firebasestorage.app/images/hero.png'
 */
export function getFirebaseImageUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // URL encode the path components while preserving slashes
  const encodedPath = cleanPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  
  return `${FIREBASE_STORAGE_BASE}/${encodedPath}`;
}

/**
 * Image paths mapped to Firebase Storage
 * Use these constants for commonly used images
 */
export const FIREBASE_IMAGES = {
  // Hero images
  HERO: getFirebaseImageUrl('images/hero.png'),
  HERO_4: getFirebaseImageUrl('images/hero4.png'),
  HERO_5: getFirebaseImageUrl('images/hero5.png'),
  HERO_EMIRATI: getFirebaseImageUrl('images/hero-emirati.png'),
  HERO_SAUDI: getFirebaseImageUrl('images/hero-saudi.webp'),
  HERO_TRADITIONAL: getFirebaseImageUrl('images/hero-traditional.webp'),
  HERO_YEMENI: getFirebaseImageUrl('images/hero-yemeni.webp'),
  
  // Homepage images
  HOME_MENS_THOBE: getFirebaseImageUrl('images/home-page-mens-thobe.png'),
  HOME_SHEMAGHS: getFirebaseImageUrl('images/home page Shemaghs image.png'),
  HOME_ABAYA: getFirebaseImageUrl('images/home page abaya.png'),
  
  // Boys section
  BOYS_HERO: getFirebaseImageUrl('images/Boys thobe hero.jpg'),
  KIDS_HERO: getFirebaseImageUrl('images/kids hero page.png'),
  KIDS_2: getFirebaseImageUrl('images/kids 2.png'),
  
  // Men's collection
  MENS_COLLECTION_1: getFirebaseImageUrl('images/menscollection1.png'),
  MENS_COLLECTION_2: getFirebaseImageUrl('images/menscollection2.png'),
  MENS_COLLECTION_3: getFirebaseImageUrl('images/menscollection3.png'),
  MENS_COLLECTION_4: getFirebaseImageUrl('images/menscollection4.png'),
  
  // Shawls
  SHAWLS_HERO: getFirebaseImageUrl('images/shawls hero.png'),
  YEMENI_SHAWLS: getFirebaseImageUrl('images/yemeni shawls homepage.webp'),
  
  // Women's
  WOMENS_HEADER_1: getFirebaseImageUrl('images/Womens Page Header 1.png'),
  WOMENS_HEADER_2: getFirebaseImageUrl('images/Womens Page Header 2.png'),
  
  // Product images - Emirati
  EMIRATI_MEN_BLACK: getFirebaseImageUrl('images/Emirati/Men/Emirati - Black.jpg'),
  EMIRATI_MEN_KHAKI: getFirebaseImageUrl('images/Emirati/Men/Emirati - Dark Khaki.jpg'),
  EMIRATI_MEN_NAVY: getFirebaseImageUrl('images/Emirati/Men/Emirati - Navy Blue.jpg'),
  EMIRATI_MEN_WHITE: getFirebaseImageUrl('images/Emirati/Men/Emirati - White.jpg'),
  EMIRATI_BOYS_WHITE: getFirebaseImageUrl('images/Emirati/Boys/Emirati - White.jpg'),
  
  // Product images - Saudi
  SAUDI_WHITE_1: getFirebaseImageUrl('images/Saudi Thobe/White/1.jpg'),
  SAUDI_WHITE_2: getFirebaseImageUrl('images/Saudi Thobe/White/2.jpg'),
  
  // Product images - Shemagh
  SHEMAGH_TRADITIONAL_BW: getFirebaseImageUrl('images/Shemagh/Traditional/Black and White.jpg'),
  SHEMAGH_TRADITIONAL_RW: getFirebaseImageUrl('images/Shemagh/Traditional/Red and White.jpg'),
  SHEMAGH_YEMENI_BLUE: getFirebaseImageUrl('images/Shemagh/Yemeni/Blue design.jpg'),
  SHEMAGH_YEMENI_BROWN: getFirebaseImageUrl('images/Shemagh/Yemeni/Brown Design.jpg'),
} as const;

