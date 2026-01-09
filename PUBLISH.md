# Publishing to npm

## Prerequisites

1. **Create an npm account** (if you don't have one):
   ```bash
   npm adduser
   # or
   npm login
   ```

2. **Verify you're logged in**:
   ```bash
   npm whoami
   ```

## Step-by-Step Publishing Guide

### Step 1: Build All Packages

```bash
# From the root directory
pnpm build
```

This builds both `@meetdhanani/optimistic-ui-core` and `@meetdhanani/optimistic-ui` packages.

### Step 2: Update Version Numbers

Update the version in both `package.json` files:

**For `packages/core/package.json`:**
```json
{
  "version": "0.1.0"  // Update to your desired version
}
```

**For `packages/react-query/package.json`:**
```json
{
  "version": "0.1.0"  // Update to the same version
}
```

**Versioning Guidelines:**
- **0.1.0** → **0.1.1** (patch: bug fixes)
- **0.1.0** → **0.2.0** (minor: new features, backward compatible)
- **0.1.0** → **1.0.0** (major: breaking changes)

### Step 3: Fix Workspace Dependencies

Before publishing, you need to replace `workspace:*` with the actual version in `packages/react-query/package.json`:

**Change:**
```json
{
  "dependencies": {
    "@meetdhanani/optimistic-ui-core": "workspace:*"
  }
}
```

**To:**
```json
{
  "dependencies": {
    "@meetdhanani/optimistic-ui-core": "^0.1.0"
  }
}
```

*(Replace `0.1.0` with your actual version)*

### Step 4: Publish Core Package First

Since `@meetdhanani/optimistic-ui` depends on `@meetdhanani/optimistic-ui-core`, publish the core package first:

```bash
cd packages/core
npm publish --access public
```

**Note:** The `--access public` flag is needed for scoped packages (`@meetdhanani/optimistic-ui-core`).

### Step 5: Publish Main Package

After the core package is published, publish the main package:

```bash
cd ../react-query
npm publish
```

### Step 6: Verify Publication

1. **Check on npm website:**
   - Visit: https://www.npmjs.com/package/@meetdhanani/optimistic-ui
   - Visit: https://www.npmjs.com/package/@meetdhanani/optimistic-ui-core

2. **Test installation in a fresh project:**
   ```bash
   mkdir test-install
   cd test-install
   npm init -y
   npm install @meetdhanani/optimistic-ui @tanstack/react-query
   ```

## Alternative: Publish Both at Once

You can also publish both packages from the root using pnpm:

```bash
# First, update versions and fix workspace dependencies (Steps 2-3 above)

# Then publish both:
pnpm -r publish --filter='./packages/*'
```

**Note:** You'll need to handle the workspace dependency replacement manually before running this.

## Publishing Checklist

Before publishing, make sure:

- [ ] All packages build successfully (`pnpm build`)
- [ ] Version numbers are updated in both `package.json` files
- [ ] `workspace:*` is replaced with actual version in `packages/react-query/package.json`
- [ ] You're logged into npm (`npm whoami`)
- [ ] You have write access to the packages
- [ ] README.md is up to date
- [ ] LICENSE file exists (MIT)
- [ ] `.npmignore` or `files` field in `package.json` is correct (only `dist` folder should be published)

## Post-Publish

After successful publication:

1. **Create a Git tag:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **Create a GitHub release** (if using GitHub):
   - Go to your repository
   - Click "Releases" → "Create a new release"
   - Tag: `v0.1.0`
   - Title: `v0.1.0`
   - Description: List of changes

3. **Update the workspace dependency back** (for local development):
   ```json
   {
     "dependencies": {
       "@meetdhanani/optimistic-ui-core": "workspace:*"
     }
   }
   ```

## Troubleshooting

### "Package name already exists"
- The package name `@meetdhanani/optimistic-ui` might be taken
- Try a different name or version

### "You do not have permission"
- Make sure you're logged in: `npm whoami`
- Check if you own the package or are part of the organization
- For scoped packages, you might need to create an organization first

### "workspace:* dependency not found"
- Make sure you've replaced `workspace:*` with the actual version (e.g., `^0.1.0`) before publishing
- The core package (`@meetdhanani/optimistic-ui-core`) must be published first
- After publishing, change it back to `workspace:*` for local development

### "dist folder is empty"
- Run `pnpm build` before publishing
- Check that `tsup` generated files in the `dist` folder

## Quick Publish Script

You can create a script to automate some steps. Add to `package.json`:

```json
{
  "scripts": {
    "prepublishOnly": "pnpm build",
    "publish:core": "cd packages/core && npm publish --access public",
    "publish:main": "cd packages/react-query && npm publish --access public",
    "publish:all": "pnpm publish:core && pnpm publish:main"
  }
}
```

**Note:** Remember to update versions and fix workspace dependencies manually before running these scripts.

