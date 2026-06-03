---
phase: 02-release-and-sprint-planning-core
plan: "03"
subsystem: api
tags: [prisma, sqlite, nextjs, react, playwright, sprint-editing, validation]

# Dependency graph
requires:
  - phase: 02-release-and-sprint-planning-core
    provides: "Release creation, sprint generation, and active-release guard"
provides:
  - Sprint list/detail/update helpers and API
  - Sprint planning summary placeholders with Phase 4 hook
  - Sprint schedule validation (overlap prevention, gap warnings)
  - Sprint list and detail UI with capacity placeholders
  - Sprint edit form with inline validation and non-blocking gap warnings
  - End-to-end browser tests for sprint editing and schedule validation
affects:
  - 03 (Feature/Story planning)
  - 04 (Capacity engine and board)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ValidationResult<T> union type extended to sprint inputs"
    - "ScheduleWarning type for non-blocking gap alerts vs blocking overlap errors"
    - "Server-side warning computation in detail page, client-side warning display in edit form"

key-files:
  created:
    - src/lib/sprint-planning-summary.ts
    - src/lib/sprints.ts
    - src/app/api/sprints/[id]/route.ts
    - src/app/sprints/[id]/page.tsx
    - src/app/sprints/[id]/edit/page.tsx
    - src/features/sprints/sprint-list.tsx
    - src/features/sprints/sprint-detail.tsx
    - src/features/sprints/sprint-edit-form.tsx
    - src/features/sprints/release-selector.tsx
    - tests/sprints.test.ts
    - tests/e2e/sprints.spec.ts
  modified:
    - src/app/sprints/page.tsx

key-decisions:
  - "Compute schedule warnings server-side on detail page so warnings persist across reloads"
  - "Distinguish blocking overlap errors (400 with errors) from non-blocking gap warnings (200 with warnings)"
  - "Use placeholder summary (plannedEffortDays: 0, capacityDays: null, riskLabel: Pending capacity) until Phase 4 wires real capacity"

requirements-completed:
  - SPR-01
  - SPR-02
  - SPR-03

# Metrics
duration: ~30min
completed: 2026-06-03
---

# Phase 2 Plan 03: Release And Sprint Planning Core Summary

**Sprint editing with overlap blocking, gap warnings, planning placeholders, and release selector — completing the sprint planning core before feature/story work begins**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-06-03T23:20:00Z
- **Completed:** 2026-06-03T23:52:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Sprint planning summary placeholders (`getSprintPlanningSummary`, `recalculateSprintPlanningSummary`) with explicit Phase 4 hook
- Sprint data helpers (`listSprintsForRelease`, `getSprintDetails`, `validateSprintInput`, `updateSprint`, `detectSprintScheduleWarnings`)
- Sprint API (`GET`/`PATCH` in `/api/sprints/[id]`) with 404/400 errors and recalculation hook invocation
- Sprint schedule validation: blocks overlapping dates with 400, warns about business-day gaps with 200
- Sprint list page with release selector when multiple releases exist
- Sprint detail page showing period, status, goal, and placeholder metrics (capacity, planned effort, remaining, occupancy, risk)
- Sprint edit form with goal, start date, end date, and status inputs
- Non-blocking gap warnings displayed on both edit form and detail page
- 13 unit tests and 4 e2e tests covering sprint queries, validation, overlap blocking, gap warnings, and editing flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sprint planning helpers, placeholders, and update API** - `5aa9a79` (feat)
2. **Task 2: Build sprint list and detail screens with planning placeholders** - `35af68b` (feat)
3. **Task 3: Add sprint goal/date editing with overlap blocking and gap warnings** - `0426cd2` (feat)

**Plan metadata:** (to be committed with SUMMARY)

## Files Created/Modified
- `src/lib/sprint-planning-summary.ts` - Phase 2 placeholder summary and Phase 4 recalculation hook
- `src/lib/sprints.ts` - Sprint queries, validation, update, and schedule warning detection
- `src/app/api/sprints/[id]/route.ts` - GET sprint detail and PATCH sprint update
- `src/app/sprints/page.tsx` - Sprint list with release selector and empty states
- `src/app/sprints/[id]/page.tsx` - Sprint detail route with server-side warning computation
- `src/app/sprints/[id]/edit/page.tsx` - Sprint edit route
- `src/features/sprints/sprint-list.tsx` - Dense table with period, status, goal, placeholder metrics
- `src/features/sprints/sprint-detail.tsx` - Detail cards for capacity, planned effort, remaining, occupancy, risk, and warnings
- `src/features/sprints/sprint-edit-form.tsx` - Client-side edit form with PATCH submission and inline validation
- `src/features/sprints/release-selector.tsx` - Client component for switching releases on the sprint list
- `tests/sprints.test.ts` - Unit tests for sprint validation, overlap detection, gap warnings, and queries
- `tests/e2e/sprints.spec.ts` - E2E tests for sprint list, detail, editing, overlap blocking, and gap warnings

## Decisions Made
- Compute schedule warnings server-side on the detail page so warnings persist across reloads
- Distinguish blocking overlap errors (400 with errors) from non-blocking gap warnings (200 with warnings)
- Use placeholder summary values (`plannedEffortDays: 0`, `capacityDays: null`, `riskLabel: "Pending capacity"`) until Phase 4 wires real capacity and story effort
- Keep the edit form on a separate `/edit` route rather than inline editing, matching the release edit pattern from 02-02

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed e2e test strict mode violation for sprint list**
- **Found during:** Task 2 verification (e2e test execution)
- **Issue:** `getByText('Sprints Test Release')` matched both the header active release badge and the page heading, causing a strict mode violation
- **Fix:** Scoped locator to `getByRole('heading', { name: 'Sprints Test Release' })`
- **Files modified:** `tests/e2e/sprints.spec.ts`
- **Verification:** E2E test passes
- **Committed in:** 0426cd2 (Task 3 commit)

**2. [Rule 1 - Bug] Fixed e2e test strict mode violation for Edit link**
- **Found during:** Task 3 verification (e2e test execution)
- **Issue:** `getByRole('link', { name: 'Edit' })` matched both the Edit button and a release link containing "Edit Sprint Release" text
- **Fix:** Added `exact: true` to the locator: `getByRole('link', { name: 'Edit', exact: true })`
- **Files modified:** `tests/e2e/sprints.spec.ts`
- **Verification:** E2E test passes
- **Committed in:** 0426cd2 (Task 3 commit)

**3. [Rule 2 - Missing Critical] Added release selector to sprint list page**
- **Found during:** Task 2 review
- **Issue:** The sprint list page selected the active or first release but provided no UI to switch releases when multiple exist
- **Fix:** Added `ReleaseSelector` client component and updated the page to accept `releaseId` query param
- **Files modified:** `src/app/sprints/page.tsx`, `src/features/sprints/release-selector.tsx`
- **Verification:** Page renders selector when multiple releases exist; navigation updates query param
- **Committed in:** 0426cd2 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs in test locators, 1 missing critical UI feature)
**Impact on plan:** All fixes were necessary for test correctness and UI completeness. No scope creep.

## Issues Encountered
- Stale Next.js dev server on port 3000 was killed before e2e tests in prior plan (02-02). No recurrence in this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Sprint foundation complete with list, detail, and editing
- Ready for 03: Feature/Story planning
- Ready for 04: Sprint board, capacity engine, and leakage tracking
- Capacity placeholders in place; Phase 4 will wire `recalculateSprintPlanningSummary` with real member/absence/holiday data

## Self-Check: PASSED

- [x] All key files exist on disk (12/12 checked)
- [x] All commits exist in git history (3 commits for 02-03)
- [x] `npm run test -- sprints` passes (13/13)
- [x] `npm run build` exits 0
- [x] `npm run test:e2e -- sprints` passes (4/4)

---
*Phase: 02-release-and-sprint-planning-core*
*Completed: 2026-06-03*
