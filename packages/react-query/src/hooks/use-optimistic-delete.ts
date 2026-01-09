/**
 * Hook-based API for optimistic deletes
 */

import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { OptimisticDeleteOptions, OptimisticContext } from '../types';
import { optimisticDeleteWithClient } from '../optimistic-delete';

/**
 * Hook for optimistic deletes
 * 
 * @example
 * ```ts
 * const mutation = useOptimisticDelete({
 *   queryKey: ['todos'],
 *   id: todoId,
 *   mutationFn: deleteTodo,
 * });
 * ```
 */
export function useOptimisticDelete<T>(
  options: OptimisticDeleteOptions<T>
): UseMutationResult<void, Error, string | number, OptimisticContext<T>> {
  const queryClient = useQueryClient();
  return useMutation(optimisticDeleteWithClient(queryClient, options));
}

