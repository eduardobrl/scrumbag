---
phase: 04-sprint-board-capacity-engine-and-leakage
plan: "02"
subsystem: capacity
tags: [capacity, sprint-summary, sqlite, prisma, vitest]
requires:
  - phase: 04-sprint-board-capacity-engine-and-leakage
    provides: sprint board and backlog story assignment preview
  - phase: 03-feature-story-and-backlog-planning
    provides: estimated story effort and sprint planned-effort summaries
provides:
  - Real gross and net sprint capacity calculations
  - Sprint summaries with capacity, remaining effort, occupancy, and risk labels
  - Sprint detail/list capacity display and over-capacity alerts
affects: [sprints, backlog, dashboard, reports, mcp]
tech-stack:
  added: []
  patterns:
    - Capacity is calculated on demand from persisted squad, calendar, settings, release, and sprint data
key-files:
  created:
    - src/lib/capacity.ts
    - tests/capacity.test.ts
    - tests/sprint-planning-summary.test.ts
  modified:
    - src/lib/sprint-planning-summary.ts
    - src/lib/backlog.ts
    - src/features/sprints/sprint-detail.tsx
    - src/features/sprints/sprint-list.tsx
    - src/app/sprints/page.tsx
key-decisions:
  - "Meeting/support values are accepted as stored percentages such as 10 and 20, with fractional values still supported."
  - "SprintPlanningSummary keeps capacityDays as net capacity for existing callers and adds explicit gross/net fields for UI."
patterns-established:
  - "Risk labels derive from planned effort versus net capacity and occupancy thresholds."
  - "Over-capacity planning remains allowed but is surfaced through danger-toned UI."
requirements-completed: [BOARD-04, CAP-01, CAP-02, CAP-03, CAP-04, CAP-05]
duration: 14 min
completed: 2026-06-03
---

# Phase 04 Plan 02: Capacity Engine Summary

**On-demand sprint capacity engine feeding sprint summaries, planning preview, and capacity UI**

## Performance

- **Duration:** 14 min
- **Started:** 2026-06-03T12:16:00Z
- **Completed:** 2026-06-03T12:30:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `calculateSprintCapacity` for gross/net hours and days, absences, holidays, meetings, support, and active member counts.
- Replaced sprint planning placeholders with real capacity, remaining capacity, occupancy, and risk labels.
- Updated sprint detail and list screens to show real capacity metrics and danger-toned overflow warnings.

## Task Commits

1. **Task 1-3: Capacity helper, summary integration, and sprint UI** - `1f3e669` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/lib/capacity.ts` - Capacity calculation helper.
- `src/lib/sprint-planning-summary.ts` - Real capacity summary integration.
- `src/lib/backlog.ts` - Backlog planning preview now receives real capacity context.
- `src/features/sprints/sprint-detail.tsx` - Gross/net/planned/remaining/occupancy/risk cards and overflow banner.
- `src/features/sprints/sprint-list.tsx` - Real capacity columns and risk badges.
- `src/app/sprints/page.tsx` - Loads full summary fields for sprint rows.
- `tests/capacity.test.ts` - Formula coverage.
- `tests/sprint-planning-summary.test.ts` - Risk-label integration coverage.

## Decisions Made

- Treated release meeting/support values above 1 as percentages, matching existing UI seed data.
- Kept capacity calculation on demand for v1 instead of persisting derived summary rows.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 04-03. Sprint closure can recalculate summaries for both closed and destination sprints after story migration.

## Self-Check: PASSED

- `npm.cmd run test -- capacity.test.ts sprint-planning-summary.test.ts` passed.
- Formula checks cover gross capacity, absence reduction, holiday reduction, meeting/support reduction, and 8-hour day normalization.

---
*Phase: 04-sprint-board-capacity-engine-and-leakage*
*Completed: 2026-06-03*
