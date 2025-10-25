import { analytics } from './firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

/**
 * Analytics helper functions for tracking user behavior
 * Only works in browser environment
 */

export function logPageView(pagePath: string) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'page_view', {
    page_path: pagePath,
  });
}

export function logProductView(productId: string, productName: string, category: string) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'view_item', {
    items: [{
      item_id: productId,
      item_name: productName,
      item_category: category,
    }],
  });
}

export function logAddToCart(productId: string, productName: string, price: number, quantity: number) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'add_to_cart', {
    currency: 'USD',
    value: price * quantity / 100, // Convert cents to dollars
    items: [{
      item_id: productId,
      item_name: productName,
      price: price / 100,
      quantity,
    }],
  });
}

export function logRemoveFromCart(productId: string, productName: string, price: number, quantity: number) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'remove_from_cart', {
    currency: 'USD',
    value: price * quantity / 100,
    items: [{
      item_id: productId,
      item_name: productName,
      price: price / 100,
      quantity,
    }],
  });
}

export function logBeginCheckout(items: any[], total: number) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'begin_checkout', {
    currency: 'USD',
    value: total / 100,
    items: items.map(item => ({
      item_id: item.productId,
      item_name: item.name,
      price: item.price / 100,
      quantity: item.qty,
    })),
  });
}

export function logPurchase(orderId: string, items: any[], total: number) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'purchase', {
    transaction_id: orderId,
    currency: 'USD',
    value: total / 100,
    items: items.map(item => ({
      item_id: item.productId,
      item_name: item.name,
      price: item.price / 100,
      quantity: item.qty,
    })),
  });
}

export function logSearch(searchTerm: string) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'search', {
    search_term: searchTerm,
  });
}

export function logNewsletterSignup(email: string) {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'sign_up', {
    method: 'newsletter',
  });
}

export function logBulkOrderInquiry() {
  if (!analytics) return;
  
  firebaseLogEvent(analytics, 'generate_lead', {
    value: 1,
    currency: 'USD',
  });
}









