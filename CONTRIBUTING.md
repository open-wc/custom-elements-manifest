# Contributing to custom-elements-manifest

## Changesets

This project uses [changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

### Adding a changeset

When you make changes that should trigger a version bump, you need to add a changeset:

```bash
yarn changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the version bump type (major, minor, or patch) for each package
3. Write a summary of the changes

The changeset will be saved as a markdown file in the `.changeset` directory.

### Version bump guidelines

- **Major**: Breaking changes
- **Minor**: New features (backwards compatible)
- **Patch**: Bug fixes and minor improvements

### Releasing

When you're ready to release:

1. **Version packages**: This will consume all changesets and update package versions
   ```bash
   yarn version
   ```

2. **Publish packages**: This will build, test, and publish all changed packages
   ```bash
   yarn release
   ```

### Workflow

1. Make your changes
2. Run `yarn changeset` to document your changes
3. Commit your changes along with the changeset file
4. When ready to release, run `yarn version` to update versions
5. Commit the version changes
6. Run `yarn release` to publish to npm

### Internal dependencies

When you update a package that other packages in this monorepo depend on, changesets will automatically bump the dependent packages with a patch version.

### Automated releases (GitHub Actions)

A GitHub Actions workflow (`.github/workflows/release.yml`) has been set up to automate the release process:

1. When changesets are merged to `master`, the workflow creates a "Version Packages" PR
2. This PR contains all version bumps and changelog updates
3. When you merge the "Version Packages" PR, packages are automatically published to npm
