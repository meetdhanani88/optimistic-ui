/**
 * Hook-based API for optimistic creates
 * Uses useQueryClient internally for reliable QueryClient access
 */

import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { OptimisticCreateOptions, OptimisticContext } from '../types';
import { optimisticCreateWithClient } from '../optimistic-create';

/**
 * Hook for optimistic creates
 * 
 * @example
 * ```ts
 * const mutation = useOptimisticCreate({
 *   queryKey: ['todos'],
 *   newItem: { title: 'New Todo', completed: false },
 *   mutationFn: createTodo,
 * });
 * ```
 */
export function useOptimisticCreate<T>(
  options: OptimisticCreateOptions<T>
): UseMutationResult<T, Error, T, OptimisticContext<T>> {
  const queryClient = useQueryClient();
  const mutationOptions = optimisticCreateWithClient(queryClient, options);
  return useMutation(mutationOptions);
}

