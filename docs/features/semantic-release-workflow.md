# semantic-release GitHub Actions workflow

Plan: [Fix semantic-release GitHub Actions workflow](../plans/fix-semantic-release-workflow.md)  
Progress: [Fix semantic-release GitHub Actions workflow](../progress/fix-semantic-release-workflow.md)

## How it works

A push to `master` starts `.github/workflows/release.yml`. The workflow:

1. Checks out the complete Git history so semantic-release can inspect commits and tags.
2. Installs the package from `package-lock.json` with `npm ci`.
3. Runs the package test suite and build.
4. Runs `semantic-release` with the configured `GITHUB_TOKEN` and npm publishing credentials.

The release job grants:

- `contents: write` for GitHub releases and tags.
- `issues: write` and `pull-requests: write` for semantic-release comments.
- `id-token: write` for npm Trusted Publishing through OIDC.

## Publishing authentication

The workflow supports the repository's existing bootstrap/fallback `NPM_TOKEN` secret. After an npm Trusted Publisher is configured for `muhamadanjar/share-layers` and `release.yml`, the token secret can be removed and OIDC can be used instead.

The package release configuration remains in `package.json`: releases use `master` and tags use the `v${version}` format.
