/**
 * Optimistic delete implementation
 * 
 * Immediately removes an item from the cache, then confirms deletion on the server.
 * Supports both flat arrays and infinite query structures.
 */

import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';
import type {
  OptimisticDeleteOptions,
  OptimisticContext,
} from './types';
import {
  isInfiniteData,
  removeItemFromArray,
  removeItemFromInfiniteData,
} from './helpers';

/**
 * Internal helper to create optimistic delete mutation options with explicit queryClient
 */
function createOptimisticDeleteOptionsInternal<T>(
  queryClient: QueryClient,
  {
    queryKey,
    id,
    mutationFn,
    strategy = 'flat',
    getId,
  }: OptimisticDeleteOptions<T>
): Omit<UseMutationOptions<void, Error, string | number, OptimisticContext<T>>, 'mutationFn'> {
  const config = { queryKey, id, strategy, getId };

  return {
    // onMutate: Optimistically remove the item from the cache
    async onMutate(variables) {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<T>(config.queryKey);

      // Use the ID from variables (passed to mutate) or fallback to config.id
      // Check for undefined/null specifically, not just falsy (since 0 is a valid ID)
      const itemId = variables !== undefined && variables !== null ? variables : config.id;

      // Optimistically remove from cache
      queryClient.setQueryData<T>(config.queryKey, (old) => {
        if (!old) {
          return old;
        }

        // Handle infinite query structure
        if (isInfiniteData<T[]>(old)) {
          return removeItemFromInfiniteData(old, itemId, config.getId) as T;
        }

        // Handle flat array
        if (Array.isArray(old)) {
          return removeItemFromArray(old, itemId, config.getId) as T;
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

    // onSuccess: Deletion confirmed, no additional action needed
    // The item is already removed from cache in onMutate

    // onSettled: Optionally refetch for consistency
    onSettled() {
      // Optionally invalidate to refetch
      // queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  };
}

/**
 * Creates a mutation configuration for optimistic deletes
 * 
 * @example
 * ```ts
 * const mutation = useMutation(
 *   optimisticDelete({
 *     queryKey: ['todos'],
 *     id: todoId,
 *     mutationFn: deleteTodo,
 *     strategy: 'flat', // or 'infinite'
 *   })
 * );
 * ```
 */
export function optimisticDelete<T>(
  options: OptimisticDeleteOptions<T>
): UseMutationOptions<void, Error, string | number, OptimisticContext<T>> {
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
          'within a QueryClientProvider. If using outside React, use optimisticDeleteWithClient instead.'
        );
      }

      const opts = createOptimisticDeleteOptionsInternal(queryClient, config);
      const onMutateFn = opts.onMutate as any;
      const result = await onMutateFn?.(variables);
      return result!;
    },

    onError(err: Error, variables: string | number, context: OptimisticContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient && context) {
        const opts = createOptimisticDeleteOptionsInternal(queryClient, config);
        const onErrorFn = opts.onError as any;
        onErrorFn?.(err, variables, context);
      }
    },

    onSettled(data: void | undefined, error: Error | null, variables: string | number, context: OptimisticContext<T> | undefined, mutationContext?: any) {
      const mutation = mutationContext?.mutation || (this as any);
      const queryClient: QueryClient | undefined = 
        mutation?.queryClient ||
        mutation?.mutationCache?.config?.queryClient ||
        mutation?.client ||
        mutationContext?.queryClient;
      
      if (queryClient) {
        const opts = createOptimisticDeleteOptionsInternal(queryClient, config);
        const onSettledFn = opts.onSettled as any;
        onSettledFn?.(data, error, variables, context);
      }
    },
  };
}

/**
 * Creates optimistic delete mutation options with explicit queryClient
 * Use this when you have access to queryClient outside of React components
 */
export function optimisticDeleteWithClient<T>(
  queryClient: QueryClient,
  options: OptimisticDeleteOptions<T>
): UseMutationOptions<void, Error, string | number, OptimisticContext<T>> {
  return {
    mutationFn: options.mutationFn,
    ...createOptimisticDeleteOptionsInternal(queryClient, options),
  };
}
