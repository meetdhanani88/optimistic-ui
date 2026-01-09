# Fix: Publishing Issues

## Problem

You're getting errors because:
1. The package name `@optimistic-ui/core` requires you to own the `@optimistic-ui` scope on npm
2. You're logged in as `meetdhanani`, which doesn't own that scope

## Solution: Choose One Option

### Option 1: Create `@optimistic-ui` Organization (Recommended)

**Steps:**
1. Go to https://www.npmjs.com/org/create
2. Create an organization named `optimistic-ui` (it's free)
3. Once created, you can publish with the current package names

**Then publish:**
```bash
cd packages/core
npm publish --access public

cd ../react-query
npm publish
```

### Option 2: Use Your Own Scope (Quick Fix)

If you want to publish immediately without creating an organization, change the package names to use your scope:

**Update `packages/core/package.json`:**
```json
{
  "name": "@meetdhanani/optimistic-ui-core"
}
```

**Update `packages/react-query/package.json`:**
```json
{
  "name": "@meetdhanani/optimistic-ui",
  "dependencies": {
    "@meetdhanani/optimistic-ui-core": "^0.1.0"
  }
}
```

**Also update imports in `packages/react-query/src/index.ts` and other files:**
- Change `@optimistic-ui/core` to `@meetdhanani/optimistic-ui-core`

**Then publish:**
```bash
cd packages/core
npm publish --access public

cd ../react-query
npm publish --access public
```

**Note:** Users would install with:
```bash
npm install @meetdhanani/optimistic-ui
```

## Which Option to Choose?

- **Option 1** is better for a public library (cleaner name: `optimistic-ui`)
- **Option 2** is faster if you want to publish immediately

## After Publishing

Once published, users can install with:
- Option 1: `npm install optimistic-ui`
- Option 2: `npm install @meetdhanani/optimistic-ui`

