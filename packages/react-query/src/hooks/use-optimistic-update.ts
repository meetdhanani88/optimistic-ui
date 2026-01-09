/**
 * Hook-based API for optimistic updates
 */

import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { OptimisticUpdateOptions, OptimisticContext } from '../types';
import { optimisticUpdateWithClient } from '../optimistic-update';

/**
 * Hook for optimistic updates
 * 
 * @example
 * ```ts
 * const mutation = useOptimisticUpdate({
 *   queryKey: ['todos'],
 *   id: todoId,
 *   updater: (todo) => ({ ...todo, completed: !todo.completed }),
 *   mutationFn: updateTodo,
 * });
 * ```
 */
export function useOptimisticUpdate<T>(
  options: OptimisticUpdateOptions<T>
): UseMutationResult<T, Error, T, OptimisticContext<T>> {
  const queryClient = useQueryClient();
  return useMutation(optimisticUpdateWithClient(queryClient, options));
}

