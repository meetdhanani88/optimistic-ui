/**
 * optimistic-ui
 * 
 * A tiny, type-safe toolkit that eliminates boilerplate for optimistic UI updates
 * using TanStack Query.
 * 
 * @example
 * ```ts
 * import { useOptimisticCreate } from 'optimistic-ui';
 * 
 * const mutation = useOptimisticCreate({
 *   queryKey: ['todos'],
 *   newItem: { title: 'New Todo' },
 *   mutationFn: createTodo,
 * });
 * ```
 * 
 * Note: For use outside React components, use the *WithClient variants.
 */

// Hook-based APIs (recommended)
export { useOptimisticCreate } from './hooks/use-optimistic-create';
export { useOptimisticUpdate } from './hooks/use-optimistic-update';
export { useOptimisticDelete } from './hooks/use-optimistic-delete';
export { useOptimisticDeleteWithUndo } from './hooks/use-optimistic-delete-with-undo';

// Function-based APIs (for use outside React or with explicit queryClient)
export { optimisticCreate, optimisticCreateWithClient } from './optimistic-create';
export { optimisticUpdate, optimisticUpdateWithClient } from './optimistic-update';
export { optimisticDelete, optimisticDeleteWithClient } from './optimistic-delete';
export { optimisticDeleteWithUndo, optimisticDeleteWithUndoWithClient, restoreDeletedItem } from './optimistic-delete-with-undo';

export type {
  OptimisticCreateOptions,
  OptimisticUpdateOptions,
  OptimisticDeleteOptions,
  OptimisticDeleteWithUndoOptions,
  OptimisticContext,
} from './types';

