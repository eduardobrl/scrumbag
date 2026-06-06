---
phase: 07-impediment-tracking
plan: 02
subsystem: ui
tags: [next-app-router, react, impediments, vitest, localization]
requires:
  - phase: 07-impediment-tracking
    provides: "Plan 07-01 impediment schema, helpers, API routes, and view payloads"
provides:
  - "Sidebar navigation and localized labels for impediments"
  - "Release-scoped impediment list and creation page"
  - "Impediment detail page with affected story links and impact summary"
  - "One-way resolution form for open impediments"
  - "Focused TSX UI regression coverage"
affects: [timeline-impact-integration, dashboard, reports]
tech-stack:
  added: []
  patterns: [server page release selection, client form API submission, renderToStaticMarkup UI tests]
key-files:
  created:
    - src/app/impediments/page.tsx
    - src/app/impediments/[id]/page.tsx
    - src/features/impediments/impediment-form.tsx
    - src/features/impediments/impediment-list.tsx
    - src/features/impediments/impediment-detail.tsx
    - src/features/impediments/resolve-impediment-form.tsx
    - tests/impediments-ui.test.tsx
  modified:
    - src/lib/navigation.ts
    - src/messages/en.json
    - src/messages/pt-BR.json
    - vitest.config.ts
key-decisions:
  - "Impediment pages use the existing releaseId query passthrough pattern."
  - "Affected stories render as title-only links to story edit pages."
patterns-established:
  - "TSX component tests use renderToStaticMarkup with a mocked next/navigation router."
  - "Resolved impediments display a final-state notice instead of any reopen action."
requirements-completed: [IMP-01, IMP-03]
duration: 20 min
completed: 2026-06-06
---

# Phase 07 Plan 02: Impediment Operational UI Summary

**Desktop-first impediment screens for release-scoped registration, list inspection, detail impact review, and final resolution**

## Performance

- **Duration:** 20 min
- **Started:** 2026-06-06T03:51:45Z
- **Completed:** 2026-06-06T04:05:02Z
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments

- Added an Impediments sidebar entry and message keys in English and Brazilian Portuguese.
- Added `/impediments` with active/selected release resolution, story multi-select creation, empty states, and a compact impact table.
- Added `/impediments/[id]` with status, dates, description, resolution notes, impact cards, affected story links, and a resolve form for open impediments.
- Added UI regression tests for create form rendering, affected-story validation, list impact columns, open/resolved detail impact, affected-story links, and absence of reopen actions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add navigation and localization for impediments** - `d029925` (feat)
2. **Task 2: Build impediment list and creation workflow** - `3b2ff2a` (feat)
3. **Task 3: Build detail and resolution workflow** - `ee432eb` (feat)
4. **Task 4: Add UI regression tests** - `d75533e` (test)

## Files Created/Modified

- `src/lib/navigation.ts` - Adds Impediments to the sidebar.
- `src/messages/en.json` - Adds English impediment labels.
- `src/messages/pt-BR.json` - Adds pt-BR impediment labels.
- `src/app/impediments/page.tsx` - Release-scoped list/create page.
- `src/app/impediments/[id]/page.tsx` - Detail page for one impediment.
- `src/features/impediments/impediment-form.tsx` - Client create form with affected-story checkboxes.
- `src/features/impediments/impediment-list.tsx` - Compact impediment table.
- `src/features/impediments/impediment-detail.tsx` - Detail layout and impact summary.
- `src/features/impediments/resolve-impediment-form.tsx` - Client resolve form.
- `tests/impediments-ui.test.tsx` - Focused UI regression tests.
- `vitest.config.ts` - Includes `.test.tsx` files in the test runner.

## Decisions Made

- The UI follows existing page patterns and hard release context through `releaseId` links.
- Affected stories link to existing story edit pages with release context preserved.
- Resolved impediments intentionally show no reopen action because resolution is final in the data layer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Enabled TSX UI test discovery**
- **Found during:** Task 2 (Build impediment list and creation workflow)
- **Issue:** The planned `tests/impediments-ui.test.tsx` file was ignored because Vitest only included `tests/**/*.test.ts`.
- **Fix:** Added `tests/**/*.test.tsx` to `vitest.config.ts`.
- **Files modified:** `vitest.config.ts`
- **Verification:** `npx vitest run tests/impediments-ui.test.tsx` passes.
- **Committed in:** `3b2ff2a`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to run the planned UI tests. No product scope expansion.

## Issues Encountered

- Browser verification on existing port 3000 hit a stale dev server with an old Prisma client. A fresh server on port 3001 verified the new pages successfully.
- Lint reports five pre-existing warnings outside impediment files; no new lint errors were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 07-03 can integrate the existing `toImpedimentView` impact fields into the release timeline and use the new detail URLs for marker drill-down.

---
*Phase: 07-impediment-tracking*
*Completed: 2026-06-06*
