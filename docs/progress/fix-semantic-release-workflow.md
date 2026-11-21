# Progress: Fix semantic-release GitHub Actions workflow

Plan: [Fix semantic-release GitHub Actions workflow](../plans/fix-semantic-release-workflow.md)

## Investigation

- Located the only release workflow at `.github/workflows/release.yml`.
- Confirmed `master`, repository URL, npm scripts, and npm lockfile are consistent.
- Reproduced the local dry run; it stopped at Git push authentication because local credentials are unavailable, so the local failure does not validate the hosted workflow token path.
- Compared the workflow with the semantic-release GitHub Actions recipe: `issues: write` and `pull-requests: write` are missing from the explicit permissions block.

## Requested version-format update

- Confirmed `.github/workflows/release.yml` already ran semantic-release via `npm run release`; that script invokes the local `semantic-release` binary.
- The configured tag format included a `v` prefix, so it did not match the requested `X.X.X` format.

## Implementation

- Added `issues: write` and `pull-requests: write` to the workflow permissions block. The existing `contents: write`, `id-token: write`, and npm token fallback remain unchanged.
- Updated the release step to run `npx semantic-release`.
- Changed `package.json` tag format to `${version}` so tags are `X.X.X` with no `v` prefix.

## Validation

- `npx semantic-release --help` confirms the command runs using the installed package.
- Parsed `.github/workflows/release.yml` with `js-yaml`; it is valid and the release step is `npx semantic-release`.
- Did not execute a real release; that requires a push to `master` and working GitHub/npm publishing credentials.
