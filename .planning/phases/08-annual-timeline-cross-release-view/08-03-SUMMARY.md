---
phase: 08-annual-timeline-cross-release-view
plan: 03
subsystem: ui-api
tags: [dnd-kit, feature-reassignment, api, undo, vitest]
requires:
  - phase: 08-annual-timeline-cross-release-view
    provides: annual timeline page and data contract
provides:
  - feature drag-and-drop between annual release swimlanes
  - feature reassignment API action with undo payload
  - story detachment to backlog on release reassignment
  - undo toast for feature moves
affects: [timeline, features, api, stories]
tech-stack:
  added: [@dnd-kit/core]
  patterns: [transactional local reassignment, client-side drag shell over server data]
key-files:
  created:
    - src/features/timeline/feature-move-toast.tsx
    - tests/annual-timeline-dnd.test.tsx
    - tests/feature-reassignment.test.ts
  modified:
    - package.json
    - package-lock.json
    - src/lib/features.ts
    - src/app/api/features/[id]/route.ts
    - src/features/timeline/annual-timeline-view.tsx
    - src/app/timeline/page.tsx
    - src/messages/en.json
    - src/messages/pt-BR.json
key-decisions:
  - "Feature reassignment detaches all stories to backlog instead of attempting smart sprint remapping."
  - "Moved unplanned features remain draggable through their unplanned chip so reassignment does not become one-way."
patterns-established:
  - "Drag/drop UI calls explicit feature PATCH actions and refreshes server data after local writes."
  - "Undo uses a validated payload containing prior release and story sprint/status state."
requirements-completed: [TL-02, TL-03]
duration: 31 min
completed: 2026-06-06
---

# Phase 08 Plan 03: Feature Reassignment Drag And Drop Summary

**Drag-and-drop feature reassignment with transactional story backlog detachment and undo toast**

## Performance

- **Duration:** 31 min
- **Started:** 2026-06-06T15:42:00Z
- **Completed:** 2026-06-06T16:13:00Z
- **Tasks:** 5
- **Files modified:** 12

## Accomplishments

- Installed `@dnd-kit/core`.
- Added transactional `reassignFeatureRelease` and `undoReassignFeatureRelease` helpers.
- Extended `PATCH /api/features/[id]` with explicit reassignment and undo actions.
- Added draggable annual timeline feature bars and release drop targets.
- Added an undo toast and kept unplanned moved features draggable.
- Added domain/API and DnD regression tests.

## Task Commits

1. **Feature reassignment drag-and-drop** - `f385fca` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/lib/features.ts` - Feature reassignment and undo domain helpers.
- `src/app/api/features/[id]/route.ts` - Explicit feature move/undo API branches.
- `src/features/timeline/annual-timeline-view.tsx` - dnd-kit context, draggable bars, drop targets, API wiring.
- `src/features/timeline/feature-move-toast.tsx` - Undo toast.
- `tests/feature-reassignment.test.ts` - Domain and API reassignment coverage.
- `tests/annual-timeline-dnd.test.tsx` - DnD rendering and guard coverage.
- `package.json` and `package-lock.json` - dnd-kit dependency.

## Decisions Made

- Kept reassignment local and explicit through the existing feature API route.
- Returned undo state from the move response instead of persisting a separate undo table.
- Made unplanned feature chips draggable so features remain movable after their stories are detached to backlog.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stabilized dnd-kit hydration ID**
- **Found during:** Browser smoke test
- **Issue:** dnd-kit generated different accessibility IDs between SSR and hydration.
- **Fix:** Added a stable `DndContext id`.
- **Files modified:** `src/features/timeline/annual-timeline-view.tsx`
- **Verification:** `npm run build`, browser smoke check
- **Committed in:** `f385fca`

**2. [Rule 3 - Blocking] Made moved unplanned features draggable**
- **Found during:** Browser drag-and-undo verification
- **Issue:** Reassigned features become unplanned after story detachment and initially had no draggable handle.
- **Fix:** Added a draggable unplanned chip.
- **Files modified:** `src/features/timeline/annual-timeline-view.tsx`
- **Verification:** Browser drag-and-undo smoke check
- **Committed in:** `f385fca`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to make the planned drag-and-drop workflow complete and reversible.

## Issues Encountered

- npm audit reported existing dependency vulnerabilities after installing `@dnd-kit/core`; no forced audit fix was run to avoid unrelated dependency churn.
- Browser Playwright role/text clicks timed out on the toast button, so the manual smoke test used direct visible coordinates after confirming the button in the DOM.
- `npm run lint` and `npm run build` continue to show only pre-existing unrelated lint warnings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 8 implementation is complete and ready for phase-level verification and milestone close-out.

---
*Phase: 08-annual-timeline-cross-release-view*
*Completed: 2026-06-06*
