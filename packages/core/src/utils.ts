/**
 * Utility functions for optimistic UI updates
 */

import type { GetId } from './types';

/**
 * Default ID getter that assumes items have an 'id' property
 */
export function defaultGetId<T extends { id?: string | number }>(
  item: T
): string | number {
  if (item.id === undefined || item.id === null) {
    throw new Error(
      'Item does not have an id property. Provide a getId function.'
    );
  }
  return item.id;
}

/**
 * Get the ID from an item using the provided getId function or default
 */
export function getIdFromItem<T>(
  item: T,
  getId?: GetId<T>
): string | number {
  if (getId) {
    return getId(item);
  }
  // Type assertion needed because we can't guarantee T has an id property
  return defaultGetId(item as { id?: string | number });
}

/**
 * Generate a temporary ID for optimistic creates
 * Uses timestamp + random to ensure uniqueness
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if an ID is a temporary ID
 */
export function isTempId(id: string | number): boolean {
  return typeof id === 'string' && id.startsWith('temp_');
}

/**
 * Check if we're in a server-side rendering context
 * This helps prevent hydration mismatches
 */
export function isSSR(): boolean {
  return typeof window === 'undefined';
}

