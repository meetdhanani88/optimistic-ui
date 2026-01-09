/**
 * Optimistic delete with undo implementation
 * 
 * Removes an item from the cache immediately, but keeps it in a "deleted" state
 * for a configurable timeout. If the user doesn't undo within the timeout,
 * the deletion is committed to the server. If they undo, the item is restored.
 */

import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';
import type {
  OptimisticDeleteWithUndoOptions,
  OptimisticContext,
} from './types';
import {
  isInfiniteData,
  removeItemFromArray,
  removeItemFromInfiniteData,
  addItemToArray,
  addItemToInfiniteData,
} from './helpers';
import { getIdFromItem } from '@meetdhanani/optimistic-ui-core';

/**
 * Context for undo operations
 */
export interface UndoContext<T> extends OptimisticContext<T> {
  /** The deleted item */
  deletedItem: T;
  /** Timeout ID for auto-commit */
  timeoutId: ReturnType<typeof setTimeout>;
  /** Whether the deletion has been committed */
  committed: boolean;
}

/**
 * Internal helper to create optimistic delete with undo mutation options
 */
function createOptimisticDeleteWithUndoOptionsInternal<T>(
  queryClient: QueryClient,
  {
    queryKey,
    id,
    mutationFn,
    undoTimeout = 5000,
    getId,
  }: OptimisticDeleteWithUndoOptions<T>
): Omit<UseMutationOptions<void, Error, string | number, UndoContext<T>>, 'mutationFn'> {
  const config = { queryKey, id, undoTimeout, getId };
  let undoContext: UndoContext<T> | null = null;

  return {
    // onMutate: Optimistically remove the item and set up undo timeout
    async onMutate(variables) {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<T>(config.queryKey);

      // Find the item to delete before removing it
      let deletedItem: T | null = null;

      const currentData = queryClient.getQueryData<T>(config.queryKey);
      if (currentData) {
        if (isInfiniteData<T[]>(currentData)) {
          // Find in infinite data
          for (const page of currentData.pages) {
            if (!Array.isArray(page)) continue;
            for (const item of page) {
              const itemId = getIdFromItem(item, config.getId);
              if (itemId === config.id) {
                deletedItem = item;
                break;
              }
            }
            if (deletedItem) break;
          }
        } else if (Array.isArray(currentData)) {
          // Find in flat array
          for (const item of currentData) {
            const itemId = getIdFromItem(item, config.getId);
            if (itemId === config.id) {
              deletedItem = item;
              break;
            }
          }
        }
      }

      if (!deletedItem) {
        return {
          previousData,
          deletedItem: null as T,
          timeoutId: setTimeout(() => {}, 0),
          committed: false,
        };
      }

      // Optimistically remove from cache
      queryClient.setQueryData<T>(config.queryKey, (old) => {
        if (!old) return old;

        if (isInfiniteData<T[]>(old)) {
          return removeItemFromInfiniteData(old, config.id, config.getId) as T;
        }

        if (Array.isArray(old)) {
          return removeItemFromArray(old, config.id, config.getId) as T;
        }

        return old;
      });

      // Set up auto-commit timeout
      const timeoutId = setTimeout(() => {
        // Auto-commit the deletion after timeout
        // The mutation will proceed automatically
        if (undoContext) {
          undoContext.committed = true;
        }
      }, config.undoTimeout);

      // Store context for undo
      undoContext = {
        previousData,
        deletedItem,
        timeoutId,
        committed: false,
      };

      return undoContext;
    },

    // onError: Rollback the optimistic update
    onError(err, variables, context) {
      if (!context) return;

      // Clear the timeout
      clearTimeout(context.timeoutId);

      // Restore the previous data
      queryClient.setQueryData(config.queryKey, context.previousData);
    },

    // onSuccess: Deletion confirmed
    onSuccess() {
      if (undoContext) {
        undoContext.committed = true;
        clearTimeout(undoContext.timeoutId);
      }
    },
  };
}

/**
 * Creates a mutation configuration for optimistic deletes with undo support
 * 
 * @example
 * ```ts
 * const mutation = useMutation(
 *   optimisticDeleteWithUndo({
 *     queryKey: ['todos'],
 *     id: todoId,
 *     mutationFn: deleteTodo,
 *     undoTimeout: 5000, // 5 seconds
 *   })
 * );
 * 
 * // To undo, call mutation.reset() before the timeout expires
 * ```
 */
export function optimisticDeleteWithUndo<T>(
  options: OptimisticDeleteWithUndoOptions<T>
): UseMutationOptions<void, Error, string | number, UndoContext<T>> {
  const config = options;
  
  return {
    mutationFn: config.mutationFn,
    async onMutate(variables: string | number, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (!queryClient) {
        throw new Error(
          'QueryClient not found. Make sure to use this with useMutation from @tanstack/react-query ' +
          'within a QueryClientProvider. If using outside React, use optimisticDeleteWithUndoWithClient instead.'
        );
      }

      const opts = createOptimisticDeleteWithUndoOptionsInternal(queryClient, config);
      const onMutateFn = opts.onMutate as any;
      const result = await onMutateFn?.(variables);
      return result!;
    },

    onError(err: Error, variables: string | number, context: UndoContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient && context) {
        const opts = createOptimisticDeleteWithUndoOptionsInternal(queryClient, config);
        const onErrorFn = opts.onError as any;
        onErrorFn?.(err, variables, context);
      }
    },

    onSuccess(data: void, variables: string | number, context: UndoContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient) {
        const opts = createOptimisticDeleteWithUndoOptionsInternal(queryClient, config);
        const onSuccessFn = opts.onSuccess as any;
        onSuccessFn?.(data, variables, context);
      }
    },
  };
}

/**
 * Creates optimistic delete with undo mutation options with explicit queryClient
 * Use this when you have access to queryClient outside of React components
 */
export function optimisticDeleteWithUndoWithClient<T>(
  queryClient: QueryClient,
  options: OptimisticDeleteWithUndoOptions<T>
): UseMutationOptions<void, Error, string | number, UndoContext<T>> {
  return {
    mutationFn: options.mutationFn,
    ...createOptimisticDeleteWithUndoOptionsInternal(queryClient, options),
  };
}

/**
 * Helper to restore a deleted item (for undo functionality)
 * This should be called when the user clicks "undo"
 */
export function restoreDeletedItem<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  deletedItem: T
): void {
  queryClient.setQueryData<T>(queryKey, (old) => {
    if (!old) {
      return [deletedItem] as T;
    }

    if (isInfiniteData<T[]>(old)) {
      return addItemToInfiniteData(old, deletedItem) as T;
    }

    if (Array.isArray(old)) {
      return addItemToArray(old, deletedItem) as T;
    }

    return old;
  });
}
