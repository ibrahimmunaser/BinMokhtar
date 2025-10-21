// Core types for BMR e-commerce with Firebase/Firestore

import { Timestamp } from 'firebase/firestore';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED';
export type Language = 'en' | 'ar';
export type Locale = 'en' | 'ar';

// ============================================================================
// Navigation & Menus
// ============================================================================

export interface NavItem {
  id: string;
  labelEn: string;
  labelAr: string;
  href?: string;
  children?: NavItem[];
  sort: number;
}

export interface MenuDoc {
  id: 'header' | 'footer';
  items: NavItem[];
  updatedAt: Timestamp | Date;
}

// ============================================================================
// Settings & Configuration
// ============================================================================

export interface StoreSettings {
  name: string;
  currency: Currency;
  locales: Locale[];
  shippingRules: ShippingRule[];
  taxPercent: number;
  announcements: string[];
  footerLinks: FooterLink[];
  social: SocialLink[];
  storyBlocks: StoryBlock[];
  iconRow: IconItem[];
}

export interface ShippingRule {
  region: string;
  flatRate?: number; // in cents
  freeThreshold?: number; // in cents
  localPickup?: boolean;
  localPickupAddress?: string;
}

export interface FooterLink {
  labelEn: string;
  labelAr: string;
  href: string;
}

export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'twitter' | 'whatsapp';
  url: string;
}

export interface StoryBlock {
  titleEn?: string;
  titleAr?: string;
  bodyEn: string;
  bodyAr: string;
}

export interface IconItem {
  iconName: string; // lucide icon name
  labelEn: string;
  labelAr: string;
}

// ============================================================================
// Products & Variants
// ============================================================================

export type ProductCategory = 'THOBE' | 'SHAAL' | 'KUFI' | 'ACCESSORY';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  titleEn: string;
  titleAr: string;
  subtitleEn?: string;
  subtitleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  category: ProductCategory;
  fabric?: string;
  care?: string;
  status: ProductStatus;
  basePrice: number; // in cents
  currency: Currency;
  featured: boolean;
  tags: string[]; // slugified tags
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  defaultImage?: ProductImage;
  counts: {
    variants: number;
    activeVariants: number;
    totalStock: number;
    reviewCount: number;
    ratingAvg: number;
  };
  seo?: {
    titleEn?: string;
    titleAr?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    canonical?: string;
  };
}

export interface ProductImage {
  url: string;
  w: number;
  h: number;
  altEn?: string;
  altAr?: string;
  sort: number;
}

export interface ProductOption {
  id: string;
  name: 'Size' | 'Length' | 'Color';
  values: string[];
  sort: number;
}

export interface Variant {
  id: string;
  productId: string;
  productSlug: string;
  productTitleEn: string;
  productTitleAr: string;
  category: ProductCategory;
  sku: string;
  size?: string;
  length?: string;
  color?: string;
  price?: number; // in cents, overrides basePrice if set
  compareAt?: number; // in cents
  stock: number;
  active: boolean;
  imageUrl?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  // Denormalized for fast queries
  tags?: string[];
  defaultImage?: ProductImage;
  // Searchable fields (lowercased)
  searchTitleEn?: string;
  searchTitleAr?: string;
}

// ============================================================================
// Cart & Orders
// ============================================================================

export interface Cart {
  id: string; // sessionId or userId
  userId?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  itemsCount: number;
  subtotal: number; // in cents
  currency: Currency;
}

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  qty: number;
  priceAtAdd: number; // in cents
  title: string;
  sku: string;
  imageUrl?: string;
  size?: string;
  length?: string;
  color?: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'REFUNDED';

export interface Order {
  id: string;
  userId?: string;
  email: string;
  status: OrderStatus;
  subtotal: number; // in cents
  shipping: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  currency: Currency;
  items: OrderItem[]; // order items
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  shippingAddress: ShippingAddress;
  giftMessage?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  qty: number;
  unitPrice: number; // in cents
  imageUrl?: string;
  size?: string;
  length?: string;
  color?: string;
}

// ============================================================================
// Reviews
// ============================================================================

export interface Review {
  id: string;
  productId: string;
  rating: number; // 1-5
  title?: string;
  body?: string;
  name?: string;
  approved: boolean;
  pinnedHome?: boolean; // show on homepage carousel
  createdAt: Timestamp | Date;
}

// ============================================================================
// Collections & Content
// ============================================================================

export interface Collection {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  productIds: string[];
  heroImage?: string;
}

export interface Page {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string; // MDX
  bodyAr: string; // MDX
  updatedAt: Timestamp | Date;
}

// ============================================================================
// Home Sections
// ============================================================================

export interface HeroSlide {
  type: 'video' | 'image';
  src: string;
  poster?: string; // for videos
  eyebrow?: string;
  titleEn: string;
  titleAr: string;
  subEn?: string;
  subAr?: string;
  ctaTextEn?: string;
  ctaTextAr?: string;
  href?: string;
}

export interface MosaicTile {
  titleEn: string;
  titleAr: string;
  href: string;
  image: string;
  span?: { cols?: number; rows?: number }; // grid span
}

export interface ShemaghTab {
  slug: string;
  labelEn: string;
  labelAr: string;
  categoryFilter?: ProductCategory;
  tagFilter?: string;
}

// ============================================================================
// Leads & Analytics
// ============================================================================

export interface Lead {
  id: string;
  email: string;
  source: string;
  createdAt: Timestamp | Date;
}

export interface BulkLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  quantity: string;
  notes: string;
  createdAt: Timestamp | Date;
}

export interface StripeEvent {
  id: string; // Stripe event ID for idempotency
  type: string;
  processed: boolean;
  createdAt: Timestamp | Date;
}

// ============================================================================
// UI & Client State
// ============================================================================

export interface FilterState {
  categories: ProductCategory[];
  sizes: string[];
  colors: string[];
  lengths: string[];
  priceRange: [number, number];
  inStock: boolean;
}

export type SortOption = 'featured' | 'new' | 'priceAsc' | 'priceDesc' | 'popular';



