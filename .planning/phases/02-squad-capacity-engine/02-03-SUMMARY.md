---
phase: 02-squad-capacity-engine
plan: 03
subsystem: capacity
tags: [bun, sqlite, react, zod, capacity, waste, overrides]

requires:
  - phase: 02-squad-capacity-engine
    provides: CapacityService, capacity API, squad members, and absences
provides:
  - Persistent waste percentage configuration in SQLite
  - Capacity override persistence and REST endpoints
  - Capacity calculations with waste deduction and prorated overrides
  - React waste config and override management UI
affects: [02-squad-capacity-engine, 03-sprint-planning-board-estimation, forecasting]

tech-stack:
  added: []
  patterns: [SQLite app_config key-value settings, date-range override records, persisted UI controls]

key-files:
  created:
    - src/components/WasteConfig.tsx
  modified:
    - src/data/schema.ts
    - src/domain/types.ts
    - src/services/capacity-service.ts
    - server.ts
    - src/components/CapacityView.tsx
    - src/App.tsx

key-decisions:
  - "Store waste percentage in app_config with default value 15."
  - "Store overrides as total hours for their own date range and prorate by overlapping working days."
  - "Keep CapacityResult real_capacity_hours as pre-waste availability and final_capacity_hours as the planning value after waste and overrides."

patterns-established:
  - "Global app settings live in app_config and are read by services at calculation time."
  - "Capacity overrides replace computed final capacity for overlapping working days."

requirements-completed: [CAP-02, CAP-03]

duration: 24 min
completed: 2026-05-31
---

# Phase 2 Plan 3: Waste, Transparency & Override Summary

**Waste-adjusted capacity planning with persisted overhead settings, manual overrides, and a transparent final-capacity breakdown.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-05-31T14:29:00Z
- **Completed:** 2026-05-31T14:53:46Z
- **Tasks:** 5
- **Files modified:** 7

## Accomplishments

- Added `app_config` and `capacity_overrides` tables, including a default `waste_percentage` of 15.
- Extended capacity results with `waste_hours`, `final_capacity_hours`, `total_waste_hours`, and `total_final_hours`.
- Added API endpoints for waste config and capacity override CRUD.
- Added `WasteConfig` and enhanced `CapacityView` with the waste control, formula explanation, override form, override list, and delete action.
- Verified that an override for a 5-day test range returns the expected final capacity of 10h.

## Task Commits

1. **Tasks 1-5: Waste config, overrides, service logic, API, and UI** - `427a595` (feat)
2. **UI clarity pass: full capacity column labels** - `bfd1cf7` (feat)

**Plan metadata:** this summary file.

## Files Created/Modified

- `src/data/schema.ts` - Added `app_config` and `capacity_overrides`.
- `src/domain/types.ts` - Added waste and override domain types plus final capacity fields.
- `src/services/capacity-service.ts` - Added waste lookup, override CRUD helpers, and prorated override application.
- `server.ts` - Added `/api/config/waste` and `/api/capacity-overrides` endpoints.
- `src/components/WasteConfig.tsx` - Added waste percentage slider/input and save flow.
- `src/components/CapacityView.tsx` - Added waste columns, formula block, override form, and override list.
- `src/App.tsx` - Exposes the enhanced Capacidade tab.

## Decisions Made

- `override_hours` is interpreted as total capacity for the override's date range, prorated by overlapping working days when queried from a wider or narrower range.
- Waste is deducted after absences and holidays; overrides replace the final post-waste capacity for the overlapping days.
- The UI keeps waste config and overrides in the Capacidade tab so the calculation inputs and outputs stay together.

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope creep; all additions support the planned waste and override behavior.

## Issues Encountered

- The API smoke test changed the persisted waste percentage to 20 while verifying PUT behavior. It was restored to the default 15 immediately after the test.

## Verification

- `bun run build` passed after implementation and after the UI clarity pass.
- API smoke test on `PORT=3100` verified `GET /api/config/waste`, `PUT /api/config/waste`, `POST /api/capacity-overrides`, `DELETE /api/capacity-overrides/:id`, and capacity output containing `waste_hours` and `final_capacity_hours`.
- Temporary verification data was deleted through the API after the smoke test.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 2 now provides a reusable capacity API and UI. Phase 3 can consume `total_final_hours` when warning whether selected sprint work exceeds available capacity.

---
*Phase: 02-squad-capacity-engine*
*Completed: 2026-05-31*
