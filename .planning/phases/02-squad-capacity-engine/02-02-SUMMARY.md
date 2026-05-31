---
phase: 02-squad-capacity-engine
plan: 02
subsystem: capacity
tags: [bun, sqlite, react, zod, date-fns, capacity]

requires:
  - phase: 02-squad-capacity-engine
    provides: Squad members, absences, holidays, repositories, and REST inputs
provides:
  - CapacityService with working-day, absence, and holiday calculations
  - GET /api/capacity endpoint with Zod date-range validation
  - React Capacidade tab with date selector and per-member breakdown table
affects: [02-squad-capacity-engine, 03-sprint-planning-board-estimation]

tech-stack:
  added: []
  patterns: [pure service over repositories, Zod-validated query endpoint, transparent capacity table]

key-files:
  created:
    - src/services/capacity-service.ts
    - src/components/CapacityView.tsx
  modified:
    - src/domain/types.ts
    - server.ts
    - src/App.tsx

key-decisions:
  - "Keep capacity calculation in a dedicated service class so sprint planning can reuse it without UI coupling."
  - "Count only Monday-Friday days for raw capacity and absence/holiday overlap."
  - "Reject capacity API date ranges longer than 365 days to prevent accidental expensive requests."

patterns-established:
  - "Capacity APIs accept ISO date ranges and validate ordering before invoking domain logic."
  - "Capacity UI computes on load and lets users recalculate explicitly after changing dates."

requirements-completed: [CAP-01]

duration: 28 min
completed: 2026-05-31
---

# Phase 2 Plan 2: Capacity Engine Summary

**Working-day capacity engine with absence and holiday deductions exposed through a date-range API and Capacidade UI tab.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-05-31T14:25:00Z
- **Completed:** 2026-05-31T14:53:46Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Added `CapacityBreakdown` and `CapacityResult` domain types for per-member and total capacity data.
- Added `CapacityService` using squad members and absences to calculate raw, absence, holiday, and real capacity.
- Added `GET /api/capacity?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` with required date validation.
- Added the Capacidade tab with date inputs, loading/error states, per-member rows, and a totals row.

## Task Commits

1. **Tasks 1-4: Capacity engine, API, and UI** - `427a595` (feat)

**Plan metadata:** this summary file.

## Files Created/Modified

- `src/services/capacity-service.ts` - Capacity domain service with working-day and overlap logic.
- `src/domain/types.ts` - Capacity result and breakdown interfaces.
- `server.ts` - Capacity API route and date-range validation.
- `src/components/CapacityView.tsx` - Date selector and transparent capacity breakdown table.
- `src/App.tsx` - Capacidade tab registration.

## Decisions Made

- Used `date-fns` `eachDayOfInterval`, `parseISO`, and `isWeekend` for date math.
- Holiday deductions only apply to `holiday` absences, with `member_id = null` applying to the whole squad.
- Very large ranges are rejected at the API boundary with a 365-day cap.

## Deviations from Plan

None - plan executed exactly as written. The implementation also included the extension points needed by `02-03` in the same production pass.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope risk; the shared capacity files were prepared for the next dependent plan.

## Issues Encountered

None.

## Verification

- `bun run build` passed.
- API smoke test on `PORT=3100` returned `total_real_hours` and member breakdown fields.
- `rg` checks confirmed exported `CapacityBreakdown`, `CapacityResult`, and `CapacityService` symbols.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan `02-03` can extend the same service, schema, API, and Capacidade UI with waste configuration and manual overrides.

---
*Phase: 02-squad-capacity-engine*
*Completed: 2026-05-31*
