/**
 * Type definitions for TanStack Query integration
 */

import type { QueryKey, InfiniteData } from '@tanstack/react-query';
import type {
  OptimisticCreateConfig,
  OptimisticUpdateConfig,
  OptimisticDeleteConfig,
  OptimisticDeleteWithUndoConfig,
  OptimisticContext,
} from '@meetdhanani/optimistic-ui-core';

/**
 * Re-export core types with QueryKey constraint
 */
export interface OptimisticCreateOptions<T> extends Omit<OptimisticCreateConfig<T>, 'queryKey'> {
  queryKey: QueryKey;
}

export interface OptimisticUpdateOptions<T> extends Omit<OptimisticUpdateConfig<T>, 'queryKey'> {
  queryKey: QueryKey;
}

export interface OptimisticDeleteOptions<T> extends Omit<OptimisticDeleteConfig<T>, 'queryKey'> {
  queryKey: QueryKey;
}

export interface OptimisticDeleteWithUndoOptions<T>
  extends Omit<OptimisticDeleteWithUndoConfig<T>, 'queryKey'> {
  queryKey: QueryKey;
}

export type { OptimisticContext };

