/**
 * Distance calculation utilities
 */

import { STORE_COORDINATES, LOCAL_DELIVERY_RADIUS_MILES, DeliveryZone } from './config';

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in miles
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance from store to customer coordinates
 * @returns Distance in miles, rounded to 1 decimal
 */
export function calculateDistanceFromStore(lat: number, lng: number): number {
  const distance = haversineDistance(
    STORE_COORDINATES.lat,
    STORE_COORDINATES.lng,
    lat,
    lng
  );
  return Math.round(distance * 10) / 10;
}

/**
 * Determine delivery zone based on distance
 */
export function getDeliveryZone(distanceMiles: number): DeliveryZone {
  return distanceMiles <= LOCAL_DELIVERY_RADIUS_MILES ? 'local' : 'standard';
}

/**
 * Check if a location is within local delivery radius
 */
export function isWithinLocalDeliveryRadius(lat: number, lng: number): boolean {
  const distance = calculateDistanceFromStore(lat, lng);
  return distance <= LOCAL_DELIVERY_RADIUS_MILES;
}

