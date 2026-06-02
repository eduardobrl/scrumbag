---
phase: 04-release-planning-ux-redesign
plan: 02
subsystem: api-service
tags: [release-board, capacity, allocation, forecast-lite]
requires:
  - phase: 04-01
    provides: release schema and repositories
provides:
  - Release board summary service
  - Feature allocation endpoint
  - Capacity warning model for release timeline
affects: [phase-04, phase-05]
tech-stack:
  added: []
  patterns: [domain service composing repositories and capacity service]
key-files:
  created: [src/services/release-planning-service.ts]
  modified: [src/domain/types.ts, src/data/release-repository.ts, server.ts]
key-decisions:
  - "Capacity warnings use estimate_days and remain advisory."
  - "Feature spans are stored as sprint id endpoints, not pixel geometry."
patterns-established:
  - "ReleaseBoardSummary is the single API contract for the release timeline."
requirements-completed: [REL-02, REL-04, REL-05, REL-06]
duration: 16 min
completed: 2026-06-01
---

# Phase 04 Plan 02: Release Planning Service Summary

**Release board summary API with feature spans, predicted completion, capacity warnings, and split suggestions**

## Performance

- **Duration:** 16 min
- **Started:** 2026-06-01T21:52:56-03:00
- **Completed:** 2026-06-01T22:08:21-03:00
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Added `ReleasePlanningService` to aggregate releases, sprints, features, estimates, and capacity.
- Added allocation validation and update route.
- Added board summary warnings for missing estimates, sprint over-capacity, and release over-capacity.
- Added lightweight split suggestions for oversized features.

## Task Commits

1. **Release board service and endpoints** - `05d2493` (feat)

## Files Created/Modified

- `src/services/release-planning-service.ts` - Board summary, capacity, warnings, split suggestions.
- `src/data/release-repository.ts` - Allocation validation and feature child queries.
- `src/domain/types.ts` - Release board summary and warning types.
- `server.ts` - Board summary and allocation routes.

## Decisions Made

- Used even distribution of feature estimate days across its sprint span for the MVP.
- Predicted completion uses the selected end sprint while warning when capacity does not fit.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None for the release planning service. API smoke passed after server startup.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Release UI can consume `/api/releases/:id/board` and allocation endpoints.

---
*Phase: 04-release-planning-ux-redesign*
*Completed: 2026-06-01*
