/**
 * Optimistic update implementation
 * 
 * Immediately updates an item in the cache, then syncs with the server response.
 * Handles both flat arrays and infinite query structures.
 */

import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';
import type {
  OptimisticUpdateOptions,
  OptimisticContext,
} from './types';
import { getIdFromItem } from '@meetdhanani/optimistic-ui-core';
import {
  isInfiniteData,
  findItemInArray,
  findItemInInfiniteData,
  replaceItemInArray,
  replaceItemInInfiniteData,
} from './helpers';

/**
 * Internal helper to create optimistic update mutation options with explicit queryClient
 */
function createOptimisticUpdateOptionsInternal<T>(
  queryClient: QueryClient,
  {
    queryKey,
    id,
    updater,
    mutationFn,
    getId,
  }: OptimisticUpdateOptions<T>
): Omit<UseMutationOptions<T, Error, T, OptimisticContext<T>>, 'mutationFn'> {
  const config = { queryKey, id, updater, getId };

  return {
    // onMutate: Optimistically update the item in the cache
    async onMutate(variables) {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<T>(config.queryKey);

      // Extract ID from variables (the item passed to mutate) or use config.id as fallback
      const itemId = variables ? getIdFromItem(variables, config.getId) : config.id;

      // Optimistically update the cache
      queryClient.setQueryData<T>(config.queryKey, (old) => {
        if (!old) return old;

        // Handle infinite query structure
        if (isInfiniteData<T[]>(old)) {
          const found = findItemInInfiniteData(old, itemId, config.getId);
          if (!found) {
            return old;
          }

          return replaceItemInInfiniteData(
            old,
            itemId,
            config.updater(found.item),
            config.getId
          ) as T;
        }

        // Handle flat array
        if (Array.isArray(old)) {
          const found = findItemInArray(old, itemId, config.getId);
          if (!found) {
            return old;
          }

          return replaceItemInArray(old, itemId, config.updater(found.item), config.getId) as T;
        }

        // If data exists but isn't an array, we can't handle it
        return old;
      });

      // Return context for rollback
      return {
        previousData,
      };
    },

    // onError: Rollback the optimistic update
    onError(err, variables, context) {
      if (!context) return;

      // Restore the previous data
      queryClient.setQueryData(config.queryKey, context.previousData);
    },

    // onSuccess: Update with server response (ensures consistency)
    onSuccess(data, variables, context) {
      const serverId = getIdFromItem(data, config.getId);

      queryClient.setQueryData<T>(config.queryKey, (old) => {
        if (!old) return [data] as T;

        if (isInfiniteData<T[]>(old)) {
          return replaceItemInInfiniteData(old, serverId, data, config.getId) as T;
        }

        if (Array.isArray(old)) {
          return replaceItemInArray(old, serverId, data, config.getId) as T;
        }

        return old;
      });
    },

    // onSettled: Optionally refetch for consistency
    onSettled() {
      // Optionally invalidate to refetch
      // queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  };
}

/**
 * Creates a mutation configuration for optimistic updates
 * 
 * @example
 * ```ts
 * const mutation = useMutation(
 *   optimisticUpdate({
 *     queryKey: ['todos'],
 *     id: todoId,
 *     updater: (todo) => ({ ...todo, completed: !todo.completed }),
 *     mutationFn: updateTodo,
 *   })
 * );
 * ```
 */
export function optimisticUpdate<T>(
  options: OptimisticUpdateOptions<T>
): UseMutationOptions<T, Error, T, OptimisticContext<T>> {
  const config = options;
  
  return {
    mutationFn: config.mutationFn,
    async onMutate(variables: T, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (!queryClient) {
        throw new Error(
          'QueryClient not found. Make sure to use this with useMutation from @tanstack/react-query ' +
          'within a QueryClientProvider. If using outside React, use optimisticUpdateWithClient instead.'
        );
      }

      const opts = createOptimisticUpdateOptionsInternal(queryClient, config);
      const onMutateFn = opts.onMutate as any;
      const result = await onMutateFn?.(variables);
      return result!;
    },

    onError(err: Error, variables: T, context: OptimisticContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient && context) {
        const opts = createOptimisticUpdateOptionsInternal(queryClient, config);
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
        const opts = createOptimisticUpdateOptionsInternal(queryClient, config);
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
        const opts = createOptimisticUpdateOptionsInternal(queryClient, config);
        const onSettledFn = opts.onSettled as any;
        onSettledFn?.(data, error, variables, context);
      }
    },
  };
}

/**
 * Creates optimistic update mutation options with explicit queryClient
 * Use this when you have access to queryClient outside of React components
 */
export function optimisticUpdateWithClient<T>(
  queryClient: QueryClient,
  options: OptimisticUpdateOptions<T>
): UseMutationOptions<T, Error, T, OptimisticContext<T>> {
  return {
    mutationFn: options.mutationFn,
    ...createOptimisticUpdateOptionsInternal(queryClient, options),
  };
}
