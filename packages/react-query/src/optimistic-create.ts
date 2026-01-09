/**
 * Optimistic create implementation
 * 
 * Adds a new item to the cache immediately, then updates it with the server response.
 * Handles temporary IDs that get replaced by server IDs.
 */

import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';
import type {
  OptimisticCreateOptions,
  OptimisticContext,
} from './types';
import { generateTempId, getIdFromItem, isTempId } from '@meetdhanani/optimistic-ui-core';
import {
  isInfiniteData,
  addItemToArray,
  addItemToInfiniteData,
  replaceTempIdInArray,
  replaceTempIdInInfiniteData,
} from './helpers';

/**
 * Internal helper to create optimistic create mutation options with explicit queryClient
 */
function createOptimisticCreateOptionsInternal<T>(
  queryClient: QueryClient,
  {
    queryKey,
    newItem,
    mutationFn,
    getId,
  }: OptimisticCreateOptions<T>
): Omit<UseMutationOptions<T, Error, T, OptimisticContext<T>>, 'mutationFn'> {
  const config = { queryKey, getId };

  return {
    // onMutate: Optimistically add the new item to the cache
    async onMutate(variables) {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<T>(config.queryKey);

      // ALWAYS use variables if it's provided - this is what was passed to mutate()
      // The variables parameter is what the user passes to mutation.mutate()
      // We MUST use variables, not newItem, because newItem is just a template
      let itemToAdd: T;
      if (variables !== undefined && variables !== null) {
        // Variables was provided - use it (this is what the user passed to mutate())
        itemToAdd = variables;
      } else {
        // No variables provided - fall back to newItem (shouldn't happen in normal usage)
        itemToAdd = newItem;
      }
      
      // Generate a temporary ID if the item doesn't have one
      const tempId = generateTempId();
      // Create a new object to ensure we don't mutate the original
      // IMPORTANT: Spread itemToAdd first to preserve all properties (including title)
      const itemWithTempId = {
        ...itemToAdd,
        id: tempId, // Override id with temp ID
      } as T;

      // Optimistically update the cache
      queryClient.setQueryData<T>(config.queryKey, (old) => {
        if (!old) {
          // If no data exists, create a new array with the item
          return [itemWithTempId] as T;
        }

        // Handle infinite query structure
        if (isInfiniteData<T[]>(old)) {
          return addItemToInfiniteData(old, itemWithTempId) as T;
        }

        // Handle flat array
        if (Array.isArray(old)) {
          return addItemToArray(old, itemWithTempId) as T;
        }

        // If data exists but isn't an array, we can't handle it
        return old;
      });

      // Return context for rollback
      return {
        previousData,
        tempId,
      };
    },

    // onError: Rollback the optimistic update
    onError(err, variables, context) {
      if (!context) return;

      // Restore the previous data
      queryClient.setQueryData(config.queryKey, context.previousData);
    },

    // onSuccess: Replace temporary ID with server ID
    onSuccess(data, variables, context) {
      if (!context) return;

      const serverId = getIdFromItem(data, config.getId);
      const tempId = context.tempId;

      if (!tempId || !isTempId(tempId)) {
        // If no temp ID was used, just update the item normally
        queryClient.setQueryData<T>(config.queryKey, (old) => {
          if (!old) return [data] as T;

          if (isInfiniteData<T[]>(old)) {
            // Find and replace the item in infinite data
            const pages = old.pages.map((page) => {
              if (!Array.isArray(page)) return page;
              return page.map((item) => {
                const itemId = getIdFromItem(item, config.getId);
                const newItemId = getIdFromItem(data, config.getId);
                return itemId === newItemId ? data : item;
              });
            });
            return { ...old, pages } as T;
          }

          if (Array.isArray(old)) {
            return old.map((item) => {
              const itemId = getIdFromItem(item, config.getId);
              const newItemId = getIdFromItem(data, config.getId);
              return itemId === newItemId ? data : item;
            }) as T;
          }

          return old;
        });
        return;
      }

      // Replace temporary ID with server ID
      queryClient.setQueryData<T>(config.queryKey, (old) => {
        if (!old) return [data] as T;

        if (isInfiniteData<T[]>(old)) {
          return replaceTempIdInInfiniteData(
            old,
            tempId,
            serverId,
            config.getId
          ) as T;
        }

        if (Array.isArray(old)) {
          return replaceTempIdInArray(old, tempId, serverId, config.getId) as T;
        }

        return old;
      });
    },

    // onSettled: Refetch to ensure consistency (optional, can be disabled)
    onSettled() {
      // Optionally invalidate to refetch, but this can be disabled for better performance
      // queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  };
}

/**
 * Creates a mutation configuration for optimistic creates
 * 
 * This function returns mutation options that work with useMutation.
 * The QueryClient is accessed through the mutation's context when useMutation is called.
 * 
 * @example
 * ```ts
 * const mutation = useMutation(
 *   optimisticCreate({
 *     queryKey: ['todos'],
 *     newItem: { title: 'New Todo', completed: false },
 *     mutationFn: createTodo,
 *   })
 * );
 * ```
 * 
 * Note: This requires useMutation to be called within a QueryClientProvider context.
 * For use outside React components, use optimisticCreateWithClient.
 */
export function optimisticCreate<T>(
  options: OptimisticCreateOptions<T>
): UseMutationOptions<T, Error, T, OptimisticContext<T>> {
  const config = options;
  
  return {
    mutationFn: config.mutationFn,
    // onMutate: Optimistically add the new item to the cache
    async onMutate(variables: T, mutationContext?: any) {
      // Access queryClient through the mutation's context
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (!queryClient) {
        throw new Error(
          'QueryClient not found. Make sure to use this with useMutation from @tanstack/react-query ' +
          'within a QueryClientProvider. If using outside React, use optimisticCreateWithClient instead.'
        );
      }

      // Recreate options with the actual queryClient and call onMutate
      const opts = createOptimisticCreateOptionsInternal(queryClient, config);
      const onMutateFn = opts.onMutate as any;
      return onMutateFn?.(variables);
    },

    onError(err: Error, variables: T, context: OptimisticContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient && context) {
        const opts = createOptimisticCreateOptionsInternal(queryClient, config);
        const onErrorFn = opts.onError as any;
        onErrorFn?.(err, variables, context);
      }
    },

    onSuccess(data: T, variables: T, context: OptimisticContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient && context) {
        const opts = createOptimisticCreateOptionsInternal(queryClient, config);
        const onSuccessFn = opts.onSuccess as any;
        onSuccessFn?.(data, variables, context);
      }
    },

    onSettled(data: T | undefined, error: Error | null, variables: T, context: OptimisticContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient) {
        const opts = createOptimisticCreateOptionsInternal(queryClient, config);
        const onSettledFn = opts.onSettled as any;
        onSettledFn?.(data, error, variables, context);
      }
    },
  };
}

/**
 * Creates optimistic create mutation options with explicit queryClient
 * Use this when you have access to queryClient outside of React components
 */
export function optimisticCreateWithClient<T>(
  queryClient: QueryClient,
  options: OptimisticCreateOptions<T>
): UseMutationOptions<T, Error, T, OptimisticContext<T>> {
  const internalOptions = createOptimisticCreateOptionsInternal(queryClient, options);
  
  return {
    mutationFn: options.mutationFn,
    ...internalOptions,
  };
}
