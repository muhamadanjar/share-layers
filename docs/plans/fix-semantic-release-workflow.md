# Fix semantic-release GitHub Actions workflow

## Problem

The release workflow grants `contents: write` and `id-token: write`, but semantic-release's GitHub plugin also needs write access to issues and pull requests for its normal release-comment operations. GitHub disables unspecified permissions when an explicit permissions block is present.

## Scope

- Update `.github/workflows/release.yml` to run semantic-release through `npx`.
- Configure release tags as `X.X.X` without a `v` prefix.
- Update the release feature documentation.

## Acceptance criteria

- A push to `master` invokes semantic-release after tests and build.
- semantic-release creates version tags in `X.X.X` format (for example, `1.2.3`).
- Workflow YAML remains valid.
- Existing package tests and build continue to pass.
