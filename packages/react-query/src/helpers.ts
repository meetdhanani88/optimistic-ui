/**
 * Helper functions for manipulating TanStack Query cache
 */

import type { QueryClient, InfiniteData } from '@tanstack/react-query';
import type { GetId } from '@meetdhanani/optimistic-ui-core';
import { getIdFromItem, isTempId } from '@meetdhanani/optimistic-ui-core';

/**
 * Check if query data is an infinite query structure
 */
export function isInfiniteData<T>(data: unknown): data is InfiniteData<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'pages' in data &&
    'pageParams' in data &&
    Array.isArray((data as InfiniteData<T>).pages)
  );
}

/**
 * Find an item in a flat array by ID
 */
export function findItemInArray<T>(
  array: T[],
  id: string | number,
  getId?: GetId<T>
): { item: T; index: number } | null {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (getIdFromItem(item, getId) === id) {
      return { item, index: i };
    }
  }
  return null;
}

/**
 * Extract array from a page (handles both direct arrays and objects with array properties)
 */
function extractArrayFromPage<T>(page: unknown): T[] | null {
  if (Array.isArray(page)) {
    return page;
  }
  if (typeof page === 'object' && page !== null) {
    // Look for common array property names
    for (const key of ['items', 'todos', 'data', 'results', 'list']) {
      if (key in page && Array.isArray((page as Record<string, unknown>)[key])) {
        return (page as Record<string, T[]>)[key];
      }
    }
  }
  return null;
}

/**
 * Find an item in infinite query data by ID
 */
export function findItemInInfiniteData<T>(
  infiniteData: InfiniteData<T[]>,
  id: string | number,
  getId?: GetId<T>
): { item: T; pageIndex: number; itemIndex: number } | null {
  for (let pageIndex = 0; pageIndex < infiniteData.pages.length; pageIndex++) {
    const page = infiniteData.pages[pageIndex];
    const array = extractArrayFromPage<T>(page);
    if (!array) continue;

    const result = findItemInArray(array, id, getId);
    if (result) {
      return {
        item: result.item,
        pageIndex,
        itemIndex: result.index,
      };
    }
  }
  return null;
}

/**
 * Replace an item in a flat array by ID
 */
export function replaceItemInArray<T>(
  array: T[],
  id: string | number,
  newItem: T,
  getId?: GetId<T>
): T[] {
  return array.map((item) => {
    if (getIdFromItem(item, getId) === id) {
      return newItem;
    }
    return item;
  });
}

/**
 * Replace an item in infinite query data by ID
 */
export function replaceItemInInfiniteData<T>(
  infiniteData: InfiniteData<T[]>,
  id: string | number,
  newItem: T,
  getId?: GetId<T>
): InfiniteData<T[]> {
  return {
    ...infiniteData,
    pages: infiniteData.pages.map((page) => {
      const array = extractArrayFromPage<T>(page);
      if (!array) return page;
      
      const updatedArray = replaceItemInArray(array, id, newItem, getId);
      
      // If page was an array, return the updated array
      if (Array.isArray(page)) {
        return updatedArray;
      }
      
      // If page was an object, update the array property and return the object
      if (typeof page === 'object' && page !== null) {
        const pageObj = page as Record<string, unknown>;
        for (const key of ['items', 'todos', 'data', 'results', 'list']) {
          if (key in pageObj && Array.isArray(pageObj[key])) {
            return { ...pageObj, [key]: updatedArray };
          }
        }
      }
      
      return page;
    }),
  };
}

/**
 * Remove an item from a flat array by ID
 */
export function removeItemFromArray<T>(
  array: T[],
  id: string | number,
  getId?: GetId<T>
): T[] {
  return array.filter((item) => getIdFromItem(item, getId) !== id);
}

/**
 * Remove an item from infinite query data by ID
 */
export function removeItemFromInfiniteData<T>(
  infiniteData: InfiniteData<T[]>,
  id: string | number,
  getId?: GetId<T>
): InfiniteData<T[]> {
  return {
    ...infiniteData,
    pages: infiniteData.pages.map((page: unknown) => {
      const array = extractArrayFromPage<T>(page);
      if (!array) return page;
      
      const updatedArray = removeItemFromArray(array, id, getId);
      
      // If page was an array, return the updated array
      if (Array.isArray(page)) {
        return updatedArray;
      }
      
      // If page was an object, update the array property and return the object
      if (typeof page === 'object' && page !== null) {
        const pageObj = page as Record<string, unknown>;
        for (const key of ['items', 'todos', 'data', 'results', 'list']) {
          if (key in pageObj && Array.isArray(pageObj[key])) {
            return { ...pageObj, [key]: updatedArray };
          }
        }
      }
      
      return page;
    }),
  };
}

/**
 * Add an item to the beginning of a flat array
 */
export function addItemToArray<T>(array: T[], newItem: T): T[] {
  return [newItem, ...array];
}

/**
 * Add an item to the beginning of the first page in infinite query data
 */
export function addItemToInfiniteData<T>(
  infiniteData: InfiniteData<T[]>,
  newItem: T
): InfiniteData<T[]> {
  if (infiniteData.pages.length === 0) {
    return {
      ...infiniteData,
      pages: [[newItem]],
      pageParams: [undefined],
    };
  }

  const firstPage = infiniteData.pages[0];
  const array = extractArrayFromPage<T>(firstPage);
  
  if (!array) {
    // If we can't extract an array, create a new page with the item
    return {
      ...infiniteData,
      pages: [[newItem], ...infiniteData.pages],
    };
  }
  
  const updatedArray = [newItem, ...array];
  
  // If first page was an array, use the updated array
  if (Array.isArray(firstPage)) {
    return {
      ...infiniteData,
      pages: [updatedArray, ...infiniteData.pages.slice(1)],
    };
  }
  
  // If first page was an object, update the array property
  if (typeof firstPage === 'object' && firstPage !== null) {
    const pageObj = firstPage as Record<string, unknown>;
    for (const key of ['items', 'todos', 'data', 'results', 'list']) {
      if (key in pageObj && Array.isArray(pageObj[key])) {
        return {
          ...infiniteData,
          pages: [{ ...pageObj, [key]: updatedArray }, ...infiniteData.pages.slice(1)],
        };
      }
    }
  }
  
  // Fallback: create new page
  return {
    ...infiniteData,
    pages: [[newItem], ...infiniteData.pages],
  };
}

/**
 * Replace a temporary ID with the server ID in an array
 */
export function replaceTempIdInArray<T>(
  array: T[],
  tempId: string | number,
  serverId: string | number,
  getId?: GetId<T>
): T[] {
  return array.map((item) => {
    const itemId = getIdFromItem(item, getId);
    if (itemId === tempId) {
      // Create a new object with the server ID
      if (typeof item === 'object' && item !== null) {
        return { ...item, id: serverId } as T;
      }
    }
    return item;
  });
}

/**
 * Replace a temporary ID with the server ID in infinite query data
 */
export function replaceTempIdInInfiniteData<T>(
  infiniteData: InfiniteData<T[]>,
  tempId: string | number,
  serverId: string | number,
  getId?: GetId<T>
): InfiniteData<T[]> {
  return {
    ...infiniteData,
    pages: infiniteData.pages.map((page: unknown) => {
      const array = extractArrayFromPage<T>(page);
      if (!array) return page;
      
      const updatedArray = replaceTempIdInArray(array, tempId, serverId, getId);
      
      // If page was an array, return the updated array
      if (Array.isArray(page)) {
        return updatedArray;
      }
      
      // If page was an object, update the array property and return the object
      if (typeof page === 'object' && page !== null) {
        const pageObj = page as Record<string, unknown>;
        for (const key of ['items', 'todos', 'data', 'results', 'list']) {
          if (key in pageObj && Array.isArray(pageObj[key])) {
            return { ...pageObj, [key]: updatedArray };
          }
        }
      }
      
      return page;
    }),
  };
}

