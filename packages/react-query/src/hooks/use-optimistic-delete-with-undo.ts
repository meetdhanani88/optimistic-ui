/**
 * Hook-based API for optimistic deletes with undo
 */

import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { OptimisticDeleteWithUndoOptions } from '../types';
import { optimisticDeleteWithUndoWithClient, type UndoContext } from '../optimistic-delete-with-undo';

/**
 * Hook for optimistic deletes with undo
 * 
 * @example
 * ```ts
 * const mutation = useOptimisticDeleteWithUndo({
 *   queryKey: ['todos'],
 *   id: todoId,
 *   mutationFn: deleteTodo,
 *   undoTimeout: 5000,
 * });
 * ```
 */
export function useOptimisticDeleteWithUndo<T>(
  options: OptimisticDeleteWithUndoOptions<T>
): UseMutationResult<void, Error, string | number, UndoContext<T>> {
  const queryClient = useQueryClient();
  return useMutation(optimisticDeleteWithUndoWithClient(queryClient, options));
}

