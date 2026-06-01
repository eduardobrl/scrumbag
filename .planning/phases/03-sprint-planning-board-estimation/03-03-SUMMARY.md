---
phase: 03-sprint-planning-board-estimation
plan: 03
subsystem: sprint-planning
tags: [react, dnd-kit, sortable, backlog-priority, sprint-order]

requires:
  - phase: 03-sprint-planning-board-estimation
    provides: sprint planning workspace and membership APIs
provides:
  - dnd kit dependencies and reusable sortable wrappers
  - Backlog priority reorder endpoint and UI
  - Sprint item order endpoint and UI
  - Drag/drop add-to-sprint interaction with button fallback
affects: [phase-03, sprint-board, board-ordering]

tech-stack:
  added:
    - "@dnd-kit/core"
    - "@dnd-kit/sortable"
    - "@dnd-kit/utilities"
  patterns:
    - DnD Kit PointerSensor and KeyboardSensor with sortableKeyboardCoordinates
    - Reorder payloads persisted through explicit API endpoints

key-files:
  created:
    - src/components/SortableItem.tsx
    - src/components/SortableList.tsx
  modified:
    - package.json
    - bun.lock
    - src/data/backlog-repository.ts
    - src/data/sprint-repository.ts
    - server.ts
    - src/components/BacklogList.tsx
    - src/components/SprintBacklogPicker.tsx
    - src/components/SprintPlanningWorkspace.tsx
    - src/components/SprintScopePanel.tsx

key-decisions:
  - "Backlog reorder is scoped to sibling/root collections so drag operations do not alter hierarchy parentage."
  - "Drag-to-sprint uses the existing add-item API, leaving repository validation authoritative."
  - "The Add button remains as a fallback beside drag-and-drop."

patterns-established:
  - "SortableList owns DnD Kit sensors and order calculation; callers own row visuals and persistence."
  - "Reorder endpoints accept compact arrays and update only explicitly scoped rows."

requirements-completed: [BACK-03, SPRT-02, SPRT-04]

duration: 7 min
completed: 2026-05-31
---

# Phase 03 Plan 03: Drag-and-Drop Planning Summary

**Dnd-kit sortable backlog and sprint ordering with persisted priority/order APIs and drag-to-sprint add flow**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-01T02:18:00Z
- **Completed:** 2026-06-01T02:25:15Z
- **Tasks:** 5
- **Files modified:** 11

## Accomplishments

- Installed dnd-kit dependencies and committed the updated lockfile.
- Added reusable sortable list/item wrappers with pointer and keyboard sensors.
- Added backlog and sprint reorder repository methods and REST endpoints.
- Enabled drag/drop reorder for backlog sibling lists and sprint scope.
- Enabled drag-to-sprint from eligible backlog with the Add button retained as fallback.

## Task Commits

1. **Tasks 1-5: Drag-and-drop planning order** - `7fcbd7d` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `package.json` / `bun.lock` - Adds dnd-kit packages.
- `src/components/SortableItem.tsx` - Wraps `useSortable`.
- `src/components/SortableList.tsx` - Wraps DnD context, sortable context, and reorder callback.
- `src/data/backlog-repository.ts` - Adds priority reorder method.
- `src/data/sprint-repository.ts` - Adds sprint item reorder method.
- `server.ts` - Adds backlog and sprint reorder endpoints.
- `src/components/BacklogList.tsx` - Adds scoped sortable backlog priority UI.
- `src/components/SprintBacklogPicker.tsx` - Makes eligible items draggable.
- `src/components/SprintPlanningWorkspace.tsx` - Handles drag-to-sprint drops.
- `src/components/SprintScopePanel.tsx` - Adds drop target and sortable sprint scope.

## Decisions Made

- Used dnd-kit for sorting and drag sensors, as planned.
- Preserved server-side story/bug membership validation for all drag/drop paths.
- Kept hierarchy parent boundaries fixed while reordering sibling lists.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope creep.

## Issues Encountered

None.

## Verification

- `bun install` passed and dnd-kit packages exist in `node_modules`.
- `bun run build` passed.
- Temporary server API smoke checks passed for backlog reorder, sprint reorder, and empty reorder payload 400s.
- Browser check confirmed the Sprints tab, selected sprint notice, capacity summary, backlog picker, and scope panel render in the local app.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `03-04`: sprint membership, ordering, and DnD primitives are available for the board columns and closure flow.

---
*Phase: 03-sprint-planning-board-estimation*
*Completed: 2026-05-31*
