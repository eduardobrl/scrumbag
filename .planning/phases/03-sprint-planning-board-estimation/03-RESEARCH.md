# Phase 3: Sprint Planning, Board & Estimation - Research

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** Inline research for Phase 3 planning

## Domain

### Phase Boundary

Phase 3 turns the existing backlog and upcoming capacity engine into a practical sprint workflow. It must let users create sprints, select stories/bugs, estimate work, prioritize with drag-and-drop, operate a simple board, and close a sprint.

Out of scope remains important:
- No planning poker.
- No automatic story suggestions.
- No custom board columns.
- No velocity, burndown, or forecasting beyond the fields needed by Phase 4.

### Core Data Model

The phase needs these concepts:
- **Sprint**: start date, end date, goal, status, and close metadata.
- **Sprint item**: membership link between a sprint and a backlog item, with sprint order and board order.
- **Estimate**: story points and squad work days stored on executable backlog items only.
- **Completion**: `completed_at` on executable backlog items, set from a user-provided real completion date when moved to Done.

Only `story` and `bug` backlog items are executable sprint items. Epics and features should aggregate estimates from child stories/bugs but not enter a sprint directly.

## Technical Research

### Drag-and-Drop Library

Use `dnd kit` rather than native HTML5 drag/drop or a hand-rolled pointer implementation.

Reasons:
- The project already uses React; dnd kit exposes React hooks/components for draggable, droppable, and sortable interactions.
- The official sortable preset supports reordering lists and moving items across sortable containers, matching backlog priority, sprint ordering, and board columns.
- The official docs include keyboard sensor and accessibility guidance, which matters because drag-and-drop should not be mouse-only.

Recommended packages:
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

Implementation guidance:
- Use stable ids equal to backlog item ids for sortable items.
- Keep optimistic local ordering only after a successful API response, or roll back on error.
- Include keyboard sensor support for sortable lists.
- Prefer simple list/column DnD in this phase; avoid nested tree dragging. Keep hierarchy browsing separate from executable sprint drag rules.

Primary docs:
- https://docs.dndkit.com/presets/sortable
- https://docs.dndkit.com/guides/accessibility
- https://docs.dndkit.com/api-documentation/sensors/keyboard

### Database Shape

SQLite is sufficient. Extend existing schema with:
- `sprints`: id, name or goal, start_date, end_date, status, capacity snapshot fields if needed, closed_at, created_at, updated_at.
- `sprint_items`: id, sprint_id, backlog_item_id, sprint_order, board_order, created_at.
- Extend `backlog_items` with `story_points`, `estimate_days`, and `completed_at`.

Keep board `status` on `backlog_items` for v1 because the context explicitly maps the board to existing statuses. Store per-column `board_order` in `sprint_items` so the same item can be manually ordered within the active sprint board.

Use a unique constraint on `(sprint_id, backlog_item_id)` to prevent duplicate sprint membership.

### API Shape

Add routes near existing REST endpoints:
- `GET/POST /api/sprints`
- `GET/PUT/DELETE /api/sprints/:id`
- `GET /api/sprints/:id/items`
- `POST /api/sprints/:id/items`
- `DELETE /api/sprints/:id/items/:itemId`
- `PUT /api/sprints/:id/items/reorder`
- `PUT /api/backlog/reorder`
- `PUT /api/backlog/:id/estimate`
- `PUT /api/sprints/:id/board`
- `POST /api/sprints/:id/close`

Validate with Zod, matching existing `server.ts` style.

### Capacity Dependency

Phase 3 depends on Phase 2 capacity outputs:
- Plan 02-02 introduces `GET /api/capacity?start_date=&end_date=`.
- Plan 02-03 adds waste and override handling.

The sprint planning UI should call `/api/capacity` for the selected sprint date range when that endpoint exists. The plan should be robust if Phase 3 is reviewed before Phase 2 execution completes: declare an execution dependency on completed Phase 2 plans and use the Phase 2 API contract rather than duplicating capacity logic.

### UI Patterns

Continue the existing lightweight React/Tailwind style:
- Controlled forms.
- List/table components.
- Top-level tabs in `App.tsx`.
- Fetch-based API calls.

Suggested top-level UI:
- A "Sprints" tab for sprint list/create/edit.
- Selected sprint opens a two-column planning workspace.
- Board can be a subsection/tab inside the selected sprint view or a separate "Board" view once a sprint is selected.

## Implementation Decisions from Context

- Planning workspace: backlog left, sprint right.
- Capacity: warn, do not block.
- Totals: show points and days/capacity side by side.
- Drag-and-drop: backlog priority, add to sprint, order sprint, order board columns.
- Executable sprint items: stories and bugs only.
- Estimates: story points and work days only on stories/bugs.
- Done transition: ask for real completion date and save `completed_at`.
- Sprint closure: explicit close action.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Drag-and-drop becomes too broad if tree hierarchy is draggable | Keep hierarchy display separate; only flat executable story/bug lists are sortable for sprint selection |
| Capacity API may not exist if Phase 2 is not executed first | Make plan dependencies explicit and use Phase 2 API contract from canonical refs |
| Reordering priorities can corrupt hierarchy ordering | Define whether reorder is global or per displayed list in API; persist deterministic integer priorities |
| Done date can be invalid for sprint dates | Validate `completed_at` as `YYYY-MM-DD`; allow retroactive dates but show clear input |
| Closing sprint before estimates/statuses are ready can confuse Phase 4 | Close action should preserve status, estimates, and completion dates; warn on unestimated or unfinished items |

## Deferred Ideas

- Planning poker.
- Suggested stories that fit remaining capacity.
- Custom board columns.
- Full velocity/burndown/forecast analytics.

---

*Phase: 03-sprint-planning-board-estimation*
*Context gathered: 2026-05-31 via inline research*
