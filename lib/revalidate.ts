import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Revalidate specific paths and tags
 */

export function revalidateHomepage() {
  revalidatePath('/');
  revalidatePath('/ar');
}

export function revalidateProduct(slug: string) {
  revalidatePath(`/product/${slug}`);
  revalidatePath(`/ar/product/${slug}`);
  revalidateTag('products');
}

export function revalidateCategory(slug: string) {
  revalidatePath(`/category/${slug}`);
  revalidatePath(`/ar/category/${slug}`);
  revalidateTag('categories');
}

export function revalidateShop() {
  revalidatePath('/shop');
  revalidatePath('/ar/shop');
  revalidateTag('products');
}

export function revalidateAllProducts() {
  revalidateTag('products');
  revalidateTag('variants');
  revalidateShop();
}

export function revalidateSettings() {
  revalidateTag('settings');
  revalidateHomepage();
}

export function revalidateMenus() {
  revalidateTag('menus');
  revalidatePath('/', 'layout');
}

export function revalidateReviews(productId?: string) {
  revalidateTag('reviews');
  if (productId) {
    revalidateTag(`reviews-${productId}`);
  }
}







