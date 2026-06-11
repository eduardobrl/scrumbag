---
phase: 10-estimate-audit-history-drift-summary
plan: 02
subsystem: release-intelligence-ui
tags: [release-detail, drift-summary, prisma, playwright, nextjs]
requires:
  - phase: 10-estimate-audit-history-drift-summary
    provides: EstimateChange audit rows and release baseline read path
provides:
  - Release-level estimate drift calculation
  - Estimate Drift section on release detail
  - Regression coverage for drift scope and browser visibility
affects: [releases, reports, estimates, audit]
tech-stack:
  added: []
  patterns: [derived release aggregates, baseline-current-delta comparison cards]
key-files:
  created: []
  modified:
    - src/lib/estimate-changes.ts
    - src/app/releases/[id]/page.tsx
    - src/features/releases/release-detail.tsx
    - src/messages/en.json
    - src/messages/pt-BR.json
    - tests/releases.test.ts
    - tests/e2e/releases.spec.ts
key-decisions:
  - "Drift totals are derived on demand from baseline item story IDs and current story values."
  - "Stories added after baseline are counted as added scope but excluded from baseline/current drift totals."
patterns-established:
  - "Release detail aggregates are fetched server-side and passed into operational UI sections."
  - "Drift delta tone reuses the story estimate delta tone helper for consistent semantics."
requirements-completed: [AUD-01, DRF-01]
duration: 35 min
completed: 2026-06-11
---

# Phase 10 Plan 02: Release Drift Summary

**Release detail Estimate Drift section comparing go-live baseline totals against current story estimates**

## Performance

- **Duration:** 35 min
- **Started:** 2026-06-11T13:00:00Z
- **Completed:** 2026-06-11T13:35:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `getReleaseEstimateDrift()` to compare baseline story point/day totals with current totals.
- Counted compared, changed, cancelled-since-baseline, and added-after-baseline stories.
- Added a localized Estimate Drift section between release stats and the sprint table.
- Covered drift calculation scope with unit tests and release detail visibility with Playwright.

## Task Commits

1. **Task 1: Calculate release drift from baseline items** - `c1da872`, `329252c`
2. **Task 2: Render Estimate Drift on release detail** - `329252c`
3. **Task 3: Prove drift updates after post-go-live estimate changes** - `329252c`
4. **Verification fix: Narrow estimate history field type** - `d2221eb`

## Files Created/Modified

- `src/lib/estimate-changes.ts` - Added release drift calculation and shared delta tone helper.
- `src/app/releases/[id]/page.tsx` - Fetches drift summary for release detail rendering.
- `src/features/releases/release-detail.tsx` - Renders baseline/current/delta cards and context metadata.
- `src/messages/en.json` and `src/messages/pt-BR.json` - Added localized drift summary labels.
- `tests/releases.test.ts` - Covers no-baseline null, drift deltas, added-after-baseline exclusion, and cancelled story inclusion.
- `tests/e2e/releases.spec.ts` - Covers visible drift summary on a release detail page.

## Decisions Made

- Added-after-baseline stories are counted with `createdAt > baseline.capturedAt` and excluded from drift totals because they are new scope, not estimate drift.
- Cancelled baselined stories stay in current totals to preserve the full baseline comparison.
- Drift stays hidden unless a baseline exists and the release is `IN_PROGRESS` or `CLOSED`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Build required explicit narrowing of estimate history fields**
- **Found during:** Build verification
- **Issue:** Shared helper typing blocked production build.
- **Fix:** Narrowed field values inside `getStoryEstimateHistory()` with an inline guard.
- **Files modified:** `src/lib/estimate-changes.ts`
- **Verification:** `npm.cmd run build` passed.
- **Committed in:** `d2221eb`

---

**Total deviations:** 1 auto-fixed (blocking TypeScript verification)
**Impact on plan:** No product scope change; release drift behavior remains as planned.

## Issues Encountered

- Playwright initially failed due strict-mode selectors matching multiple valid elements. Selectors were tightened to target the intended history/release controls.
- Phase 9 tracking summaries are absent even though the prerequisite code exists; this is a planning artifact mismatch, not a Phase 10 runtime blocker.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 10 implementation is ready for phase-level verification and milestone closeout.

---
*Phase: 10-estimate-audit-history-drift-summary*
*Completed: 2026-06-11*
