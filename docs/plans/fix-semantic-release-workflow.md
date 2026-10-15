# Fix semantic-release GitHub Actions workflow

## Problem

The release workflow grants `contents: write` and `id-token: write`, but semantic-release's GitHub plugin also needs write access to issues and pull requests for its normal release-comment operations. GitHub disables unspecified permissions when an explicit permissions block is present.

## Scope

- Update `.github/workflows/release.yml` permissions only.
- Preserve the existing npm authentication fallback (`NPM_TOKEN`) and OIDC permission.
- Do not change release branches, package metadata, scripts, or dependency management.

## Acceptance criteria

- The release job can create GitHub releases and write semantic-release comments on issues and pull requests.
- npm publishing authentication remains available through the configured token/OIDC path.
- Workflow YAML remains valid.
- Existing package tests and build continue to pass.
