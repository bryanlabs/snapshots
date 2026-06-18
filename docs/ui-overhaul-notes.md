# Snapshot Website UI Overhaul Notes

Last updated: 2026-06-14.

## Implemented In This Pass

- Conservative dependency refresh to current wanted patch/minor versions for
  Next 15, React 19, Prisma 6, NextAuth beta, Playwright, TanStack Query, and
  related UI/runtime packages.
- Removed unused direct dependencies that were increasing audit surface:
  `@aws-sdk/client-s3`, `bull`, `graz`, `bitcoinjs-lib`, `iron-session`, and
  `@types/bull`.
- Replaced duplicated signed-download URL modal logic with:
  - `hooks/useDownloadUrl.ts`
  - `components/snapshots/DownloadUrlDialog.tsx`
- Simplified `SnapshotListClient` so realtime snapshot listing is the canonical
  list implementation.
- Redesigned snapshot cards to keep chips for status/access states and show
  operator metadata as fields: height, database, size, and archive format.
- Added first-class API/CLI examples on chain pages through
  `components/chains/ApiAccessPanel.tsx`.
- Extended the latest snapshot API with:
  - `database=leveldb|goleveldb|pebble|pebbledb`
  - `include_previous=true`
  - structured `latest`, `previous`, and `commands` fields
- Added signed-link expiry to the download URL API response and dialog.
- Made local development resilient when custom snapshot PostgreSQL is not
  configured: official snapshots still render while custom DB-backed rows are
  skipped.

## Guardrail State

- `npm run lint` now checks the active snapshot UI/API path instead of relying
  on deprecated `next lint`.
- `npx tsc --noEmit` passes.
- `npm run build` passes with TypeScript enforced.
- `next build` skips its broad all-repo ESLint pass because older product
  experiments still contain lint failures. Keep the explicit scoped lint command
  until stale surfaces are removed or fixed.

## Deadweight / Labs Boundary

The repo still contains product areas that should be treated as labs or
quarantine candidates before they block deploy hygiene again:

- Telegram group access and invitation management.
- Credits/billing pages that no longer match the current Prisma schema.
- Legacy auth APIs and old session helpers.
- Test and demo pages.
- Stale API docs, Postman collections, and historical baseline outputs.
- Monitoring/Sentry demo surfaces such as `/api/test-error`.

Recommended next step: either delete each surface deliberately or move it under
a clearly named disabled/labs boundary with matching lint and typecheck
exclusions. Do not let these surfaces silently shape the public snapshot UX.

## Remaining Security Follow-Up

`npm audit --omit=dev` is improved but not clean. The major remaining issue is
the Keplr ADR-36 verification dependency path through `@keplr-wallet/cosmos`
and vulnerable `protobufjs`. The clean fix is to replace that dependency with a
small audited verifier built from maintained CosmJS primitives or another
actively maintained ADR-36 verification package.
