# Progress: Fix semantic-release GitHub Actions workflow

Plan: [Fix semantic-release GitHub Actions workflow](../plans/fix-semantic-release-workflow.md)

## Investigation

- Located the only release workflow at `.github/workflows/release.yml`.
- Confirmed `master`, repository URL, `v${version}` tags, npm scripts, and npm lockfile are consistent.
- Reproduced the local dry run; it stopped at Git push authentication because local credentials are unavailable, so the local failure does not validate the hosted workflow token path.
- Compared the workflow with the semantic-release GitHub Actions recipe: `issues: write` and `pull-requests: write` are missing from the explicit permissions block.

## Implementation

- Added `issues: write` and `pull-requests: write` to the workflow permissions block. The existing `contents: write`, `id-token: write`, and npm token fallback remain unchanged.

## Validation

- Release workflow YAML parsed successfully with `js-yaml`.
- `npm test -- --run` passed: 22 test files, 82 tests.
- `npm run build` reached TypeScript compilation but failed on the pre-existing user change in `src/adapters/wms-adapter.ts:7` (`layer_name` is not a property of the current type). Generated dist changes from this check were restored; the workflow-only change does not cause this failure.
