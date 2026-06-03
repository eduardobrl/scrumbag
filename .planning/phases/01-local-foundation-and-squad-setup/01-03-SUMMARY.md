---
phase: 01-local-foundation-and-squad-setup
plan: "03"
subsystem: squad-calendar
tags: [nextjs, prisma, sqlite, squad, absences, holidays, capacity]
requires:
  - phase: 01-local-foundation-and-squad-setup
    provides: Walking skeleton app shell and persisted settings values
provides:
  - Full Squad route for member create/edit/activation state
  - Absence and holiday create/list APIs and UI
  - Phase 1 gross daily capacity and future calendar summary metrics
  - Unit and browser coverage for squad/calendar persistence
affects: [phase-02, phase-04]
tech-stack:
  added: []
  patterns:
    - Client table controls call PATCH routes then refresh server data
    - Date-only inputs are normalized to UTC date values for storage/display
key-files:
  created:
    - src/app/api/absences/route.ts
    - src/app/api/holidays/route.ts
    - src/app/api/squad-members/[id]/route.ts
    - src/features/squad/member-form.tsx
    - src/features/squad/member-table.tsx
    - src/features/squad/absence-form.tsx
    - src/features/squad/absence-table.tsx
    - src/features/squad/holiday-form.tsx
    - src/features/squad/holiday-table.tsx
    - src/features/squad/squad-summary.tsx
    - src/lib/capacity-summary.ts
    - tests/squad-calendar.test.ts
    - tests/e2e/squad.spec.ts
  modified:
    - src/app/squad/page.tsx
    - src/lib/squad.ts
key-decisions:
  - "Use soft activation state for squad members instead of deleting rows."
  - "Expose absence impact by type now, with sprint impact explicitly deferred until Phase 2 creates sprints."
patterns-established:
  - "Calendar APIs return date-only view models for client display."
  - "Summary metrics are computed in src/lib/capacity-summary.ts from persisted settings and squad data."
requirements-completed: [APP-05, SQUAD-01, SQUAD-02, SQUAD-03, SQUAD-04, SQUAD-05]
duration: 31 min
completed: 2026-06-02
---

# Phase 1 Plan 03: Squad Calendar Summary

**SQLite-backed squad member editing, absences, holidays, and Phase 1 capacity summary metrics**

## Performance

- **Duration:** 31 min
- **Started:** 2026-06-02T21:18:50-03:00
- **Completed:** 2026-06-02T21:49:58-03:00
- **Tasks:** 3 completed
- **Files modified:** 15

## Accomplishments

- Added member editing and activation/deactivation through `PATCH /api/squad-members/[id]`.
- Added persisted absence and holiday APIs plus forms/tables on the Squad screen.
- Added summary cards for active members, daily capacity, future absences, holidays, and an explicit Phase 2 sprint-impact placeholder.
- Added unit tests for validation/deactivation/capacity calculations and e2e coverage for member, absence, holiday, and summary persistence.

## Task Commits

1. **Tasks 1-3: Squad member editing, calendar CRUD, and summary metrics** - `6b8f8e5` (feat)

**Plan metadata:** pending in this summary commit.

## Files Created/Modified

- `src/lib/squad.ts` - Member update plus absence/holiday validation, CRUD helpers, and view serialization.
- `src/lib/capacity-summary.ts` - Active member count, daily gross capacity, future absence count, holiday count, and absence impact by type.
- `src/app/squad/page.tsx` - Full Squad management screen.
- `src/app/api/squad-members/[id]/route.ts` - Member update route.
- `src/app/api/absences/route.ts` - Absence list/create route.
- `src/app/api/holidays/route.ts` - Holiday list/create route.
- `src/features/squad/*` - Member, absence, holiday, and summary UI components.
- `tests/squad-calendar.test.ts` - Unit coverage for Phase 1 squad/calendar rules.
- `tests/e2e/squad.spec.ts` - Browser persistence check for Squad management and summary metrics.

## Decisions Made

- Deactivation updates `active=false` and keeps member history intact.
- Holiday and absence forms use date-only ISO strings consistently across API, storage, and UI display.
- The sprint impact area intentionally says sprint impact appears after Phase 2 instead of inventing release/sprint data in Phase 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Absence form kept an empty member selection after first member creation**
- **Found during:** Task 3 e2e verification
- **Issue:** The form initialized before any members existed and did not pick the first member after `router.refresh()`.
- **Fix:** Added an effect to select the first available member when the member list arrives.
- **Files modified:** `src/features/squad/absence-form.tsx`
- **Verification:** `npm run test:e2e -- squad` passes.
- **Committed in:** `6b8f8e5`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required for the planned first-member absence creation flow. No scope change.

## Issues Encountered

- Playwright assertions were tightened with exact labels and metric test ids because the dense Squad screen legitimately repeats words like Date, Vacation, and Holidays.

## Verification

- `npm run test -- squad-calendar` - passed
- `npm run test` - passed
- `npm run build` - passed
- `npm run lint` - passed
- `npm run test:e2e -- squad` - passed
- `npm run test:e2e` - passed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 2 can build release and sprint planning on top of persisted settings, active member schedules, absences, holidays, and daily gross capacity summaries.

---
*Phase: 01-local-foundation-and-squad-setup*
*Completed: 2026-06-02*
