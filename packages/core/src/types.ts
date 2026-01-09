/**
 * Core types for optimistic UI updates
 */

/**
 * A function that extracts a unique identifier from an item
 */
export type GetId<T> = (item: T) => string | number;

/**
 * Strategy for handling deletions in paginated data
 * - 'flat': Simple array, remove item by ID
 * - 'infinite': TanStack Query infinite query structure with pages
 */
export type DeleteStrategy = 'flat' | 'infinite';

/**
 * Configuration for optimistic create operations
 */
export interface OptimisticCreateConfig<T> {
  /** Query key to update */
  queryKey: unknown[];
  /** The new item to add optimistically */
  newItem: T;
  /** Mutation function that creates the item on the server */
  mutationFn: (item: T) => Promise<T>;
  /** Optional function to extract ID from item (defaults to item.id) */
  getId?: GetId<T>;
}

/**
 * Configuration for optimistic update operations
 */
export interface OptimisticUpdateConfig<T> {
  /** Query key to update */
  queryKey: unknown[];
  /** ID of the item to update */
  id: string | number;
  /** Function that transforms the existing item */
  updater: (item: T) => T;
  /** Mutation function that updates the item on the server */
  mutationFn: (item: T) => Promise<T>;
  /** Optional function to extract ID from item (defaults to item.id) */
  getId?: GetId<T>;
}

/**
 * Configuration for optimistic delete operations
 */
export interface OptimisticDeleteConfig<T> {
  /** Query key to update */
  queryKey: unknown[];
  /** ID of the item to delete */
  id: string | number;
  /** Mutation function that deletes the item on the server */
  mutationFn: (id: string | number) => Promise<void>;
  /** Strategy for handling deletions (defaults to 'flat') */
  strategy?: DeleteStrategy;
  /** Optional function to extract ID from item (defaults to item.id) */
  getId?: GetId<T>;
}

/**
 * Configuration for optimistic delete with undo operations
 */
export interface OptimisticDeleteWithUndoConfig<T> {
  /** Query key to update */
  queryKey: unknown[];
  /** ID of the item to delete */
  id: string | number;
  /** Mutation function that deletes the item on the server */
  mutationFn: (id: string | number) => Promise<void>;
  /** Timeout in milliseconds before the deletion is committed (defaults to 5000) */
  undoTimeout?: number;
  /** Optional function to extract ID from item (defaults to item.id) */
  getId?: GetId<T>;
}

/**
 * Context returned from onMutate for rollback purposes
 */
export interface OptimisticContext<T> {
  /** Previous query data before the optimistic update */
  previousData: T | undefined;
  /** Temporary ID used for create operations (if applicable) */
  tempId?: string | number;
}

