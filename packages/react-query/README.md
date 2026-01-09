# optimistic-ui

> A tiny, type-safe toolkit that eliminates boilerplate for optimistic UI updates using TanStack Query.

[![npm version](https://img.shields.io/npm/v/optimistic-ui.svg)](https://www.npmjs.com/package/optimistic-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Optimistic UI?

**Optimistic UI** is a UX pattern where the UI updates immediately when a user performs an action, before the server confirms the change. This creates a snappy, responsive feel that makes applications feel instant and modern.

For example, when a user toggles a todo item as complete:
- **Without optimistic UI**: The checkbox waits for the server response (200-500ms delay) before updating
- **With optimistic UI**: The checkbox updates instantly, and if the server request fails, it automatically reverts

## The Problem

While TanStack Query (React Query) is excellent for data fetching, implementing optimistic updates requires writing a lot of repetitive boilerplate code. For every mutation, you need to:

1. **Cancel in-flight queries** to prevent race conditions
2. **Snapshot previous data** for rollback on errors
3. **Generate temporary IDs** for new items (and replace them later)
4. **Handle cache updates** for different data structures (arrays, infinite queries, etc.)
5. **Implement error rollback** logic
6. **Manage edge cases** like concurrent mutations, empty caches, and SSR

This results in **~150 lines of boilerplate code per mutation**, which is:
- ❌ Repetitive and error-prone
- ❌ Hard to maintain across multiple mutations
- ❌ Easy to forget edge cases
- ❌ Difficult to get right with infinite queries and pagination

## Why This Library?

I built `optimistic-ui` because I found myself writing the same optimistic update logic over and over again across multiple projects. The pattern was always the same, but implementing it correctly required:

- Handling temporary IDs that get replaced by server IDs
- Extracting arrays from infinite query page structures
- Preserving data structure integrity
- Managing rollback scenarios
- Supporting both flat arrays and paginated data

Instead of copying and pasting 150 lines of code for each mutation, you can now use a simple hook or function that handles all of this automatically. The library:

- ✅ **Eliminates 90% of boilerplate** - From 150 lines to just 5 lines
- ✅ **Handles all edge cases** - Works with arrays, infinite queries, and custom ID getters
- ✅ **Type-safe** - Full TypeScript support with excellent autocomplete
- ✅ **Battle-tested** - Handles concurrent mutations, SSR, and error scenarios
- ✅ **Zero configuration** - Works out of the box with sensible defaults

## Features

- ✅ **Create / Update / Delete** - Full CRUD support with optimistic updates
- 🔄 **Automatic Rollback** - Errors automatically revert optimistic changes
- ↩️ **Undo Support** - Built-in undo functionality for deletions
- ♾️ **Pagination & Infinite Queries** - Works seamlessly with `useInfiniteQuery`
- 🛡️ **SSR Safe** - Handles server-side rendering correctly
- 📦 **Type-Safe** - Full TypeScript support with excellent DX
- 🎯 **Zero Boilerplate** - Eliminates repetitive optimistic update code

## Installation

```bash
npm i @meetdhanani/optimistic-ui @tanstack/react-query
# or
pnpm add @meetdhanani/optimistic-ui @tanstack/react-query
# or
yarn add @meetdhanani/optimistic-ui @tanstack/react-query
```

## Quick Start

### Recommended: Hook-based API

```tsx
import { 
  useOptimisticCreate, 
  useOptimisticUpdate, 
  useOptimisticDelete,
  useOptimisticDeleteWithUndo 
} from '@meetdhanani/optimistic-ui';

function TodoList() {
  // Create
  const createMutation = useOptimisticCreate({
    queryKey: ['todos'],
    newItem: { title: 'New Todo', completed: false },
    mutationFn: createTodo,
  });

  // Update
  const updateMutation = useOptimisticUpdate({
    queryKey: ['todos'],
    id: todoId,
    updater: (todo) => ({ ...todo, completed: !todo.completed }),
    mutationFn: updateTodo,
  });

  // Delete
  const deleteMutation = useOptimisticDelete({
    queryKey: ['todos'],
    id: todoId,
    mutationFn: deleteTodo,
  });

  // Delete with Undo
  const deleteWithUndoMutation = useOptimisticDeleteWithUndo({
    queryKey: ['todos'],
    id: todoId,
    mutationFn: deleteTodo,
    undoTimeout: 5000,
  });

  return (
    // Your UI here
  );
}
```

### Alternative: Function-based API

```tsx
import { useMutation } from '@tanstack/react-query';
import { 
  optimisticCreate, 
  optimisticUpdate, 
  optimisticDelete,
  optimisticDeleteWithUndo 
} from '@meetdhanani/optimistic-ui';

function TodoList() {
  // Create
  const createMutation = useMutation(
    optimisticCreate({
      queryKey: ['todos'],
      newItem: { title: 'New Todo', completed: false },
      mutationFn: createTodo,
    })
  );

  // Update
  const updateMutation = useMutation(
    optimisticUpdate({
      queryKey: ['todos'],
      id: todoId,
      updater: (todo) => ({ ...todo, completed: !todo.completed }),
      mutationFn: updateTodo,
    })
  );

  // Delete
  const deleteMutation = useMutation(
    optimisticDelete({
      queryKey: ['todos'],
      id: todoId,
      mutationFn: deleteTodo,
    })
  );

  // Delete with Undo
  const deleteWithUndoMutation = useMutation(
    optimisticDeleteWithUndo({
      queryKey: ['todos'],
      id: todoId,
      mutationFn: deleteTodo,
      undoTimeout: 5000,
    })
  );

  return (
    // Your UI here
  );
}
```

**Note:** For use outside React components or when you have explicit access to QueryClient, use the `*WithClient` variants:
- `optimisticCreateWithClient(queryClient, options)`
- `optimisticUpdateWithClient(queryClient, options)`
- `optimisticDeleteWithClient(queryClient, options)`
- `optimisticDeleteWithUndoWithClient(queryClient, options)`

**Note:** The hook-based API (`useOptimisticCreate`, etc.) is recommended as it provides more reliable QueryClient access. The function-based API works but requires QueryClientProvider context.

## API Reference

### Available Exports

**Hooks (Recommended):**
- `useOptimisticCreate<T>` - Create items optimistically
- `useOptimisticUpdate<T>` - Update items optimistically
- `useOptimisticDelete<T>` - Delete items optimistically
- `useOptimisticDeleteWithUndo<T>` - Delete items with undo support

**Functions (For use with `useMutation` or outside React):**
- `optimisticCreate<T>` / `optimisticCreateWithClient<T>` - Create items optimistically
- `optimisticUpdate<T>` / `optimisticUpdateWithClient<T>` - Update items optimistically
- `optimisticDelete<T>` / `optimisticDeleteWithClient<T>` - Delete items optimistically
- `optimisticDeleteWithUndo<T>` / `optimisticDeleteWithUndoWithClient<T>` - Delete items with undo
- `restoreDeletedItem<T>` - Helper to restore deleted items (for undo functionality)

**Types:**
- [`OptimisticCreateOptions<T>`](./src/types.ts#L17-L19) - Options for optimistic create operations
- [`OptimisticUpdateOptions<T>`](./src/types.ts#L21-L23) - Options for optimistic update operations
- [`OptimisticDeleteOptions<T>`](./src/types.ts#L25-L27) - Options for optimistic delete operations
- [`OptimisticDeleteWithUndoOptions<T>`](./src/types.ts#L29-L32) - Options for optimistic delete with undo operations
- [`OptimisticContext<T>`](./src/types.ts#L34) - Context returned from optimistic mutations for rollback
- [`UndoContext<T>`](./src/optimistic-delete-with-undo.ts#L26-L33) - Extended context for undo operations (includes deletedItem, timeoutId, committed)

### Hooks (Recommended)

The hook-based API is recommended as it provides more reliable QueryClient access through React context.

#### `useOptimisticCreate<T>`

Creates a new item optimistically. Handles temporary IDs that get replaced by server IDs.

```tsx
const mutation = useOptimisticCreate({
  queryKey: ['todos'],
  newItem: { title: 'New Todo', completed: false },
  mutationFn: createTodo,
  getId: (item) => item.id, // Optional, defaults to item.id
});
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `newItem: T` - The new item to add optimistically
- `mutationFn: (item: T) => Promise<T>` - Function that creates the item on the server
- `getId?: (item: T) => string | number` - Optional function to extract ID (defaults to `item.id`)

**Returns:** `UseMutationResult<T, Error, T, OptimisticContext<T>>`

#### `useOptimisticUpdate<T>`

Updates an existing item optimistically.

```tsx
const mutation = useOptimisticUpdate({
  queryKey: ['todos'],
  id: todoId,
  updater: (todo) => ({ ...todo, completed: !todo.completed }),
  mutationFn: updateTodo,
  getId: (item) => item.id, // Optional
});
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `id: string | number` - ID of the item to update
- `updater: (item: T) => T` - Function that transforms the existing item
- `mutationFn: (item: T) => Promise<T>` - Function that updates the item on the server
- `getId?: (item: T) => string | number` - Optional function to extract ID

**Returns:** `UseMutationResult<T, Error, T, OptimisticContext<T>>`

#### `useOptimisticDelete<T>`

Deletes an item optimistically.

```tsx
const mutation = useOptimisticDelete({
  queryKey: ['todos'],
  id: todoId,
  mutationFn: deleteTodo,
  strategy: 'flat', // or 'infinite' for infinite queries
  getId: (item) => item.id, // Optional
});
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `id: string | number` - ID of the item to delete
- `mutationFn: (id: string | number) => Promise<void>` - Function that deletes the item on the server
- `strategy?: 'flat' | 'infinite'` - Strategy for handling deletions (defaults to 'flat')
- `getId?: (item: T) => string | number` - Optional function to extract ID

**Returns:** `UseMutationResult<void, Error, string | number, OptimisticContext<T>>`

#### `useOptimisticDeleteWithUndo<T>`

Deletes an item with undo support. The item is removed immediately but can be restored within a timeout.

```tsx
const mutation = useOptimisticDeleteWithUndo({
  queryKey: ['todos'],
  id: todoId,
  mutationFn: deleteTodo,
  undoTimeout: 5000, // 5 seconds (default)
  getId: (item) => item.id, // Optional
});

// To undo, call mutation.reset() before the timeout expires
// Or use restoreDeletedItem() helper with the context
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `id: string | number` - ID of the item to delete
- `mutationFn: (id: string | number) => Promise<void>` - Function that deletes the item on the server
- `undoTimeout?: number` - Timeout in milliseconds before deletion is committed (defaults to 5000)
- `getId?: (item: T) => string | number` - Optional function to extract ID

**Returns:** `UseMutationResult<void, Error, string | number, UndoContext<T>>`

### Functions (For use outside React or with explicit QueryClient)

These functions can be used with `useMutation` from TanStack Query. They require QueryClientProvider context, or you can use the `*WithClient` variants with an explicit QueryClient.

#### `optimisticCreate<T>`

Creates a new item optimistically. Handles temporary IDs that get replaced by server IDs.

```tsx
const mutation = useMutation(
  optimisticCreate({
    queryKey: ['todos'],
    newItem: { title: 'New Todo', completed: false },
    mutationFn: createTodo,
    getId: (item) => item.id, // Optional, defaults to item.id
  })
);
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `newItem: T` - The new item to add optimistically
- `mutationFn: (item: T) => Promise<T>` - Function that creates the item on the server
- `getId?: (item: T) => string | number` - Optional function to extract ID (defaults to `item.id`)

**Returns:** `UseMutationOptions<T, Error, T, OptimisticContext<T>>`

#### `optimisticCreateWithClient<T>`

Same as `optimisticCreate`, but accepts an explicit QueryClient. Use this when you have access to QueryClient outside of React components.

```tsx
const mutation = useMutation(
  optimisticCreateWithClient(queryClient, {
    queryKey: ['todos'],
    newItem: { title: 'New Todo', completed: false },
    mutationFn: createTodo,
  })
);
```

**Parameters:**
- `queryClient: QueryClient` - The TanStack Query client instance
- `options: OptimisticCreateOptions<T>` - Same options as `optimisticCreate`

**Returns:** `UseMutationOptions<T, Error, T, OptimisticContext<T>>`

#### `optimisticUpdate<T>`

Updates an existing item optimistically.

```tsx
const mutation = useMutation(
  optimisticUpdate({
    queryKey: ['todos'],
    id: todoId,
    updater: (todo) => ({ ...todo, completed: !todo.completed }),
    mutationFn: updateTodo,
    getId: (item) => item.id, // Optional
  })
);
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `id: string | number` - ID of the item to update
- `updater: (item: T) => T` - Function that transforms the existing item
- `mutationFn: (item: T) => Promise<T>` - Function that updates the item on the server
- `getId?: (item: T) => string | number` - Optional function to extract ID

**Returns:** `UseMutationOptions<T, Error, T, OptimisticContext<T>>`

#### `optimisticUpdateWithClient<T>`

Same as `optimisticUpdate`, but accepts an explicit QueryClient.

```tsx
const mutation = useMutation(
  optimisticUpdateWithClient(queryClient, {
    queryKey: ['todos'],
    id: todoId,
    updater: (todo) => ({ ...todo, completed: !todo.completed }),
    mutationFn: updateTodo,
  })
);
```

**Parameters:**
- `queryClient: QueryClient` - The TanStack Query client instance
- `options: OptimisticUpdateOptions<T>` - Same options as `optimisticUpdate`

**Returns:** `UseMutationOptions<T, Error, T, OptimisticContext<T>>`

#### `optimisticDelete<T>`

Deletes an item optimistically.

```tsx
const mutation = useMutation(
  optimisticDelete({
    queryKey: ['todos'],
    id: todoId,
    mutationFn: deleteTodo,
    strategy: 'flat', // or 'infinite' for infinite queries
    getId: (item) => item.id, // Optional
  })
);
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `id: string | number` - ID of the item to delete
- `mutationFn: (id: string | number) => Promise<void>` - Function that deletes the item on the server
- `strategy?: 'flat' | 'infinite'` - Strategy for handling deletions (defaults to 'flat')
- `getId?: (item: T) => string | number` - Optional function to extract ID

**Returns:** `UseMutationOptions<void, Error, string | number, OptimisticContext<T>>`

#### `optimisticDeleteWithClient<T>`

Same as `optimisticDelete`, but accepts an explicit QueryClient.

```tsx
const mutation = useMutation(
  optimisticDeleteWithClient(queryClient, {
    queryKey: ['todos'],
    id: todoId,
    mutationFn: deleteTodo,
  })
);
```

**Parameters:**
- `queryClient: QueryClient` - The TanStack Query client instance
- `options: OptimisticDeleteOptions<T>` - Same options as `optimisticDelete`

**Returns:** `UseMutationOptions<void, Error, string | number, OptimisticContext<T>>`

#### `optimisticDeleteWithUndo<T>`

Deletes an item with undo support. The item is removed immediately but can be restored within a timeout.

```tsx
const mutation = useMutation(
  optimisticDeleteWithUndo({
    queryKey: ['todos'],
    id: todoId,
    mutationFn: deleteTodo,
    undoTimeout: 5000, // 5 seconds (default)
    getId: (item) => item.id, // Optional
  })
);

// To undo, call mutation.reset() before the timeout expires
// Or use restoreDeletedItem() helper with the context
```

**Options:**
- `queryKey: QueryKey` - The query key to update
- `id: string | number` - ID of the item to delete
- `mutationFn: (id: string | number) => Promise<void>` - Function that deletes the item on the server
- `undoTimeout?: number` - Timeout in milliseconds before deletion is committed (defaults to 5000)
- `getId?: (item: T) => string | number` - Optional function to extract ID

**Returns:** `UseMutationOptions<void, Error, string | number, UndoContext<T>>`

#### `optimisticDeleteWithUndoWithClient<T>`

Same as `optimisticDeleteWithUndo`, but accepts an explicit QueryClient.

```tsx
const mutation = useMutation(
  optimisticDeleteWithUndoWithClient(queryClient, {
    queryKey: ['todos'],
    id: todoId,
    mutationFn: deleteTodo,
    undoTimeout: 5000,
  })
);
```

**Parameters:**
- `queryClient: QueryClient` - The TanStack Query client instance
- `options: OptimisticDeleteWithUndoOptions<T>` - Same options as `optimisticDeleteWithUndo`

**Returns:** `UseMutationOptions<void, Error, string | number, UndoContext<T>>`

#### `restoreDeletedItem<T>`

Helper function to restore a deleted item (for undo functionality). This should be called when the user clicks "undo".

```tsx
import { restoreDeletedItem } from '@meetdhanani/optimistic-ui';

// In your undo handler
const handleUndo = () => {
  if (mutation.context?.deletedItem) {
    restoreDeletedItem(
      queryClient,
      ['todos'],
      mutation.context.deletedItem
    );
    mutation.reset();
  }
};
```

**Parameters:**
- `queryClient: QueryClient` - The TanStack Query client instance
- `queryKey: QueryKey` - The query key to update
- `deletedItem: T` - The item to restore

**Returns:** `void`

## Examples

### Basic Todo List

```tsx
import { useQuery } from '@tanstack/react-query';
import { 
  useOptimisticCreate, 
  useOptimisticUpdate, 
  useOptimisticDelete 
} from '@meetdhanani/optimistic-ui';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

function TodoList() {
  const { data: todos } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  const createMutation = useOptimisticCreate<Todo>({
    queryKey: ['todos'],
    newItem: { id: '', title: 'New Todo', completed: false },
    mutationFn: createTodo,
  });

  const updateMutation = useOptimisticUpdate<Todo>({
    queryKey: ['todos'],
    id: '', // Will be provided when calling mutate
    updater: (todo) => ({ ...todo, completed: !todo.completed }),
    mutationFn: updateTodo,
  });

  const deleteMutation = useOptimisticDelete<Todo>({
    queryKey: ['todos'],
    id: '', // Will be provided when calling mutate
    mutationFn: deleteTodo,
  });

  return (
    <div>
      {todos?.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => updateMutation.mutate(todo)}
          />
          <span>{todo.title}</span>
          <button onClick={() => deleteMutation.mutate(todo.id)}>Delete</button>
        </div>
      ))}
      <button onClick={() => createMutation.mutate({ id: '', title: 'New', completed: false })}>
        Add Todo
      </button>
    </div>
  );
}
```

### Infinite Queries

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useOptimisticCreate } from '@meetdhanani/optimistic-ui';

function InfiniteTodoList() {
  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ['todos'],
    queryFn: ({ pageParam }) => fetchTodos({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const createMutation = useOptimisticCreate<Todo>({
    queryKey: ['todos'],
    newItem: { id: '', title: 'New Todo', completed: false },
    mutationFn: createTodo,
  });

  // The library automatically handles infinite query structures
  // New items are added to the first page
}
```

### Delete with Undo

```tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticDeleteWithUndo, restoreDeletedItem } from '@meetdhanani/optimistic-ui';

function TodoWithUndo() {
  const queryClient = useQueryClient();
  const [undoId, setUndoId] = useState<string | null>(null);

  const deleteMutation = useOptimisticDeleteWithUndo<Todo>({
    queryKey: ['todos'],
    id: '', // Will be provided when calling mutate
    mutationFn: deleteTodo,
    undoTimeout: 5000,
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    setUndoId(id);
    setTimeout(() => setUndoId(null), 5000);
  };

  const handleUndo = () => {
    if (deleteMutation.context?.deletedItem) {
      restoreDeletedItem(queryClient, ['todos'], deleteMutation.context.deletedItem);
      deleteMutation.reset();
      setUndoId(null);
    }
  };

  return (
    <div>
      {undoId && (
        <div>
          Item deleted
          <button onClick={handleUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}
```

## Running Examples

This repository includes working examples to help you get started:

### React Example

```bash
# Install dependencies (from root)
pnpm install

# Run the React example
pnpm dev:examples

# Or from the example directory:
cd examples/react
pnpm install
pnpm dev
```

**Important:** This monorepo uses **pnpm workspaces**. You must use `pnpm`, not `npm` or `yarn`. The `workspace:*` protocol in `package.json` is a pnpm feature.

**What the React example shows:**
- ✅ Optimistic create (items appear immediately)
- ✅ Optimistic update (changes apply immediately)
- ✅ Optimistic delete (items disappear immediately)
- ✅ Error handling and rollback

### Infinite Query Example

```bash
cd examples/infinite-query
pnpm install
pnpm dev
```

**What the infinite query example shows:**
- ✅ Optimistic updates with paginated data
- ✅ Real API integration (JSONPlaceholder)
- ✅ Handling object-based page structures
- ✅ Error simulation and rollback

## Migration Guide

### Before (Manual Optimistic Updates)

```tsx
const mutation = useMutation({
  mutationFn: createTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);
    
    queryClient.setQueryData<Todo[]>(['todos'], (old) => [
      { ...newTodo, id: `temp-${Date.now()}` },
      ...(old || []),
    ]);
    
    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context?.previousTodos);
  },
  onSuccess: (data, variables, context) => {
    // Replace temp ID with server ID
    queryClient.setQueryData<Todo[]>(['todos'], (old) =>
      old?.map((todo) =>
        todo.id === context.tempId ? data : todo
      ) ?? [data]
    );
  },
});
```

### After (With optimistic-ui)

**Using hooks (recommended):**
```tsx
const mutation = useOptimisticCreate({
  queryKey: ['todos'],
  newItem: newTodo,
  mutationFn: createTodo,
});
```

**Or using functions:**
```tsx
const mutation = useMutation(
  optimisticCreate({
    queryKey: ['todos'],
    newItem: newTodo,
    mutationFn: createTodo,
  })
);
```

**Benefits:**
- ✅ 90% less code
- ✅ Automatic temp ID handling
- ✅ Works with infinite queries out of the box
- ✅ Type-safe
- ✅ Handles edge cases automatically

### Manual vs Library Comparison

**Without the library**, you'd need to write ~150 lines of boilerplate for each mutation:
- ❌ Manual temp ID generation
- ❌ Manual array extraction from object pages
- ❌ Manual cache updates in `onMutate`
- ❌ Manual rollback in `onError`
- ❌ Manual temp ID replacement in `onSuccess`
- ❌ Manual structure preservation (array vs object pages)
- ❌ Error-prone and repetitive

**With the library**, just 5 lines:
- ✅ Automatic temp ID generation
- ✅ Automatic array extraction
- ✅ Automatic cache updates
- ✅ Automatic rollback
- ✅ Automatic temp ID replacement
- ✅ Handles all edge cases
- ✅ Type-safe and tested

## Edge Cases Handled

- ✅ **Concurrent Mutations** - Cancels in-flight queries to prevent overwrites
- ✅ **Temporary IDs** - Automatically replaces temp IDs with server IDs
- ✅ **Pagination** - Correctly handles infinite query structures
- ✅ **Undo Cancellation** - Properly cleans up timeouts and restores state
- ✅ **SSR Safety** - Prevents hydration mismatches
- ✅ **Stale Cache** - Preserves referential integrity

## Requirements

- React 18+
- TanStack Query v5+
- TypeScript 5+ (recommended)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
