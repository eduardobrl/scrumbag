---
phase: 10-estimate-audit-history-drift-summary
plan: 01
subsystem: database-api-ui
tags: [prisma, sqlite, stories, audit-history, nextjs, playwright]
requires:
  - phase: 09-release-planning-state-editable-estimates
    provides: PLANNING release status and immutable release estimate baseline capture
provides:
  - EstimateChange persistence model and SQLite sync table
  - Transactional post-go-live story estimate audit records
  - Story edit estimate history and optional change reason UI
affects: [stories, releases, estimates, audit]
tech-stack:
  added: []
  patterns: [server-side audit capture in data-layer mutations, chronological audit display in edit forms]
key-files:
  created:
    - src/lib/estimate-changes.ts
  modified:
    - prisma/schema.prisma
    - scripts/db-sync.ts
    - src/lib/stories.ts
    - src/app/stories/[id]/edit/page.tsx
    - src/features/stories/story-form.tsx
    - src/messages/en.json
    - src/messages/pt-BR.json
    - tests/stories.test.ts
    - tests/e2e/stories.spec.ts
key-decisions:
  - "Audit remains per field, with one row for storyPoints and one row for estimatedDays when both change."
  - "Change reason is optional free text and is attached to each audit row created by the same edit."
patterns-established:
  - "Estimate changes are compared against persisted old values and written in the same transaction as the story update."
  - "Post-go-live audit UI is hidden entirely until history exists."
requirements-completed: [AUD-01, AUD-02, AUD-03]
duration: 55 min
completed: 2026-06-11
---

# Phase 10 Plan 01: Estimate Audit History Summary

**Per-field post-go-live estimate audit trail with optional reasons and chronological story edit history**

## Performance

- **Duration:** 55 min
- **Started:** 2026-06-11T12:30:00Z
- **Completed:** 2026-06-11T13:25:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added `EstimateChange` persistence linked to stories with cascade delete and timestamp/story indexes.
- Updated `updateStory()` to record story point and estimated day changes only for `IN_PROGRESS` or `CLOSED` releases.
- Added a post-go-live change reason input and chronological estimate history section on the story edit page.
- Covered audit rules with unit tests and history display with Playwright.

## Task Commits

1. **Task 1: Add estimate change persistence and query helpers** - `c1da872`
2. **Task 2: Record post-go-live estimate edits in updateStory()** - `c1da872`
3. **Task 3: Render story estimate history on the edit page** - `329252c`
4. **Verification fix: Narrow estimate history field type** - `d2221eb`

## Files Created/Modified

- `prisma/schema.prisma` - Added `EstimateChange` model and `Story.estimateChanges` relation.
- `scripts/db-sync.ts` - Mirrored the new SQLite table and indexes.
- `src/lib/estimate-changes.ts` - Added field constants, story history query, delta tone helper, and drift foundation helpers.
- `src/lib/stories.ts` - Added transactional estimate audit creation after story updates.
- `src/app/stories/[id]/edit/page.tsx` - Fetches and serializes estimate history for the edit UI.
- `src/features/stories/story-form.tsx` - Shows change reason input and chronological history cards.
- `src/messages/en.json` and `src/messages/pt-BR.json` - Added localized audit labels.
- `tests/stories.test.ts` - Covers post-go-live audit rows, planning-time no-op, and null transitions.
- `tests/e2e/stories.spec.ts` - Covers visible story estimate history after a post-go-live edit.

## Decisions Made

- The audit trigger lives in `updateStory()` so UI and API writes share the same server-side rule.
- Empty change reasons are stored as `null`/omitted text rather than placeholder strings.
- Null estimate transitions are recorded when a field actually changes; null-to-null remains silent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript did not narrow Prisma string fields through the history filter**
- **Found during:** Build verification
- **Issue:** `EstimateChange.field` is generated as `string`, and the filtered map still failed `StoryEstimateHistoryItem` typing.
- **Fix:** Replaced filter/map with `flatMap` and an inline field guard so `field` narrows before object creation.
- **Files modified:** `src/lib/estimate-changes.ts`
- **Verification:** `npm.cmd run build` passed.
- **Committed in:** `d2221eb`

---

**Total deviations:** 1 auto-fixed (blocking TypeScript verification)
**Impact on plan:** No scope change; the fix preserves the planned data contract.

## Issues Encountered

- Phase 9 summary artifacts are missing in `.planning/`, but the prerequisite Phase 9 code and tests are present in source. Execution proceeded against the source truth and this mismatch should be cleaned up separately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Story-level estimate history is ready for release-level drift aggregation and display.

---
*Phase: 10-estimate-audit-history-drift-summary*
*Completed: 2026-06-11*
