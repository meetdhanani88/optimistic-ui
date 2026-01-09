# @meetdhanani/optimistic-ui-core

> Framework-agnostic core logic for optimistic UI updates

This is the core package that provides framework-agnostic utilities and types for optimistic UI updates. It's used internally by `@meetdhanani/optimistic-ui` and typically not used directly.

## Installation

```bash
npm install @meetdhanani/optimistic-ui-core
```

## Usage

This package is primarily used internally by `@meetdhanani/optimistic-ui`. If you're building a custom adapter for a different framework, you can use this package directly.

### Exports

- `GetId<T>` - Type for ID extraction functions
- `DeleteStrategy` - Type for deletion strategies
- `OptimisticCreateConfig<T>` - Configuration for optimistic creates
- `OptimisticUpdateConfig<T>` - Configuration for optimistic updates
- `OptimisticDeleteConfig<T>` - Configuration for optimistic deletes
- `OptimisticDeleteWithUndoConfig<T>` - Configuration for optimistic deletes with undo
- `OptimisticContext<T>` - Context returned from optimistic operations
- `defaultGetId` - Default ID extraction function
- `getIdFromItem` - Extract ID from an item
- `generateTempId` - Generate temporary IDs
- `isTempId` - Check if an ID is temporary
- `isSSR` - Check if running in SSR environment

## License

MIT

