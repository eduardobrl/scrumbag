# Phase 3: Sprint Planning, Board & Estimation - Context

**Gathered:** 2026-05-31T11:20:41.3224670-03:00
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers sprint creation and sprint planning workflow for the existing local Scrumbag app. Users can create sprints, select eligible backlog items, estimate stories and bugs in story points and squad work days, prioritize work with drag-and-drop, manage a simple sprint board, and close a sprint. The phase should clarify sprint execution mechanics only; forecasting, velocity analytics, automatic sprint suggestions, planning poker, and custom workflow columns stay out of scope.

</domain>

<decisions>
## Implementation Decisions

### Sprint Planning Workspace
- **D-01:** Sprint planning uses a two-column workspace: backlog on the left and the selected sprint on the right.
- **D-02:** Capacity warnings are advisory, not blocking. Users may save a sprint that exceeds capacity.
- **D-03:** The planning workspace must show story points and work-days/capacity side by side.
- **D-04:** Sprints are created and selected from a dedicated sprint list with a "new sprint" action. Selecting a sprint opens its planning workspace.

### Drag-and-Drop Priority and Sprint Selection
- **D-05:** Drag-and-drop must support global backlog prioritization, adding eligible items to a sprint, and ordering items within a sprint.
- **D-06:** Only stories and bugs are executable sprint items. Epics and features are organization/aggregation nodes and cannot be added directly to a sprint.
- **D-07:** If a user drags an epic or feature into a sprint, the UI must prevent the drop and show a short explanation.
- **D-08:** Reordering the global backlog updates the persisted `priority` automatically.
- **D-09:** Removing an item from a sprint returns it to the top of the backlog.

### Estimation Semantics
- **D-10:** Story points and work-day estimates are editable only on stories and bugs.
- **D-11:** The "days" estimate means squad work days, not calendar days.
- **D-12:** Unestimated items may enter a sprint with a visible warning; they do not count toward point or day totals until estimated.
- **D-13:** Epics and features display aggregate estimates from all direct and indirect child stories/bugs.
- **D-14:** Story points use a closed Fibonacci set: `1, 2, 3, 5, 8, 13, 21`.

### Board Behavior and Sprint Closure
- **D-15:** The sprint board maps directly to the existing backlog `status` states: `backlog`, `in_progress`, and `done`. UI labels may use Backlog/To Do, In Progress, and Done.
- **D-16:** Moving an item to Done must ask for the real completion date and save it as `completed_at`, because the tool may be updated after the work actually closed.
- **D-17:** Moving an item out of Done is allowed without confirmation and clears `completed_at`.
- **D-18:** Board item order is manual drag-and-drop per column and must be persisted.
- **D-19:** Sprints have an explicit "Close sprint" action that marks the sprint closed and freezes the result/baseline needed by later velocity and analytics work.

### the agent's Discretion
- Choose the exact drag-and-drop library and UI implementation approach that best fits React 19, Vite, and the existing lightweight Tailwind UI.
- Choose the exact persistence shape for sprint membership, sprint ordering, and board column ordering, provided the decisions above remain true and the schema stays local SQLite.
- Choose concise Portuguese UI copy for warnings, empty states, and confirmations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Requirements
- `.planning/PROJECT.md` - Defines Scrumbag's core value, constraints, internal-user context, and out-of-scope boundaries.
- `.planning/REQUIREMENTS.md` - Defines Phase 3 requirements `BACK-03`, `SPRT-01`, `SPRT-02`, `SPRT-03`, `SPRT-04`, `EST-01`, and `EST-02`.
- `.planning/ROADMAP.md` - Defines Phase 3 goal, success criteria, dependency on Phase 2, MVP mode, and UI hint.

### Phase 2 Capacity Dependency
- `.planning/phases/02-squad-capacity-engine/02-01-SUMMARY.md` - Establishes squad/absence APIs and the repository/UI patterns Phase 3 should follow.
- `.planning/phases/02-squad-capacity-engine/02-02-PLAN.md` - Defines the capacity result API and transparent breakdown that Phase 3 planning should consume.
- `.planning/phases/02-squad-capacity-engine/02-03-PLAN.md` - Defines waste/override capacity behavior that Phase 3 capacity warnings should respect once Phase 2 is complete.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/domain/types.ts` - Existing `BacklogItem`, `BacklogItemStatus`, `SquadMember`, and absence types are the domain anchor. Phase 3 should extend this file with sprint, sprint item, estimate, completion, and board-order types.
- `src/data/schema.ts` - SQLite schema initialization already owns backlog, squad, absence, and sync tables. Phase 3 should add sprint tables and backlog estimate/completion fields here.
- `src/data/backlog-repository.ts` - Existing repository pattern uses parameterized SQLite queries and simple CRUD methods. Sprint repositories should follow this style.
- `src/components/BacklogList.tsx` and `src/components/BacklogForm.tsx` - Existing backlog UI and tree hierarchy are reusable starting points for backlog selection and estimate editing.
- `src/App.tsx` - Existing tabbed shell is the integration point for adding Sprints/Planning/Board views.

### Established Patterns
- REST routes live in `server.ts` and validate input with Zod before calling repositories/services.
- React UI uses controlled forms, simple table/list components, fetch calls, and Tailwind utility classes.
- Backlog hierarchy already uses `parent_id`, while root/child queries sort by `priority DESC, created_at DESC`.
- Current `BacklogItemStatus` values are `backlog`, `in_progress`, and `done`; Phase 3 board should reuse these states instead of inventing a separate workflow for v1.

### Integration Points
- New sprint APIs should attach beside `/api/backlog`, `/api/squad`, `/api/absences`, and the upcoming `/api/capacity`.
- Planning should consume Phase 2 capacity results once `/api/capacity` includes waste and overrides.
- Backlog drag-and-drop must update persisted priorities and refresh the tree/list without breaking existing CRUD and Excel import behavior.

</code_context>

<specifics>
## Specific Ideas

- Planning should feel like a practical two-pane workbench: visible backlog, visible sprint, visible totals.
- Capacity warnings should keep the tool honest without taking decision authority away from the Tech Lead/PM.
- The completion date prompt is required because Scrumbag may be updated after work was actually completed.
- Closed sprint state should prepare the ground for Phase 4 velocity, burndown, and forecasting.

</specifics>

<deferred>
## Deferred Ideas

- Planning poker remains out of scope for v1.
- Automatic story suggestions based on remaining capacity remain deferred to v2 requirement `SUGG-01`.
- Custom board columns remain out of scope for v1.
- Advanced analytics, burndown, velocity, and probabilistic forecasting belong to Phase 4.

</deferred>

---

*Phase: 3-Sprint Planning, Board & Estimation*
*Context gathered: 2026-05-31T11:20:41.3224670-03:00*
