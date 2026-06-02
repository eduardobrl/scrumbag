# Phase 04: Release Planning & UX Redesign - Research

**Researched:** 2026-06-01 local time
**Domain:** Release-first sprint planning, SQLite schema migration, React/Tailwind UX, dnd-kit timeline interactions
**Confidence:** HIGH for codebase constraints and existing stack, MEDIUM for UX interaction recommendations, LOW for package legitimacy because slopcheck was unavailable

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

The current sprint UX puts sprint creation, selection, planning workspace, and sprint board on the same screen. This makes it unclear what is selected and what the user is supposed to do next.

The backlog creation flow is also confusing because it exposes too many item concepts at once and permits ambiguous planning structures.

Planning should become release-first:

1. A release is created before its sprints.
2. A release contains features.
3. Features contain stories and bugs.
4. Stories and bugs must not exist without a parent feature.
5. Sprints belong to a release.
6. Sprint scope is chosen from stories and bugs inside the release's features.

Epics may remain as an optional portfolio layer above features, but they should not be mandatory for release or sprint planning.

The main release screen should start from features, not from sprints.

The release planning view should behave like a board/timeline:

- Available features can be dragged into a release.
- Release sprints appear as timeline columns.
- A feature can span one or more sprints.
- The user can expand or shrink a feature span manually.
- The UI shows the predicted sprint where each feature will complete.
- Capacity warnings appear when a feature or sprint allocation exceeds available capacity.
- If a feature is too large for the release, the system should suggest splitting it.

Sprint list and sprint board should be separated:

- The sprint list remains a place to browse available sprints.
- Clicking a sprint opens a dedicated sprint screen.
- The sprint screen should use tabs such as Board, Planning, Capacity, and Closure.

Backlog management should become feature-first:

- Creating stories and bugs should happen inside a feature context.
- The form should reduce ambiguity around type, parent, and status.
- Root-level work should primarily be features, with optional epics above them.

### the agent's Discretion

- Should feature spans be sized by total estimated days, story points, or manual user sizing with advisory capacity math?
- Should the release timeline show stories/bugs inside each feature by default, or only after expanding the feature?
- Should adding a feature to an in-progress release require a visible change note or warning?
- Should oversized-feature splitting be a lightweight suggestion or a guided workflow?

### Deferred Ideas (OUT OF SCOPE)

None listed in CONTEXT.md. Project-level deferred items remain v2: MCP server, sprint story suggestions, advanced waste/overhead tracking, enhanced offline-first sync, and JSON export/backup.
</user_constraints>

## Summary

Phase 4 should be planned as a data-model and navigation redesign first, then a release board UI. The current code has global `sprints`, global sprint candidate queries, nullable `backlog_items.parent_id`, and a one-screen sprint tab that renders creation, list, planning workspace, and board together. [VERIFIED: codebase grep] The phase goal requires releases to own sprints, features to own stories/bugs, sprint scope to be release-scoped, and sprint execution screens to be separated from release planning. [VERIFIED: .planning/phases/04-release-planning-ux-redesign/04-CONTEXT.md]

The standard implementation should add `releases`, `release_features`, and release-scoped sprint data, then reuse the existing sprint execution model (`sprint_items` contains stories/bugs only) instead of making features executable sprint items. [VERIFIED: codebase grep] Feature spans should be stored as release-level allocation metadata (`start_sprint_id`, `end_sprint_id`, `board_order`) and rendered as CSS grid spans over sprint columns; changing a span is a domain action over sprint ids, not arbitrary pixel geometry. [ASSUMED]

**Primary recommendation:** Plan Phase 4 in four waves: schema/API migration, release board calculations, release-first UX, then dedicated sprint screens and backlog feature-first flow. [ASSUMED]

## Project Constraints (from AGENTS.md)

- App must run in a browser or as a no-install executable; avoid desktop installer approaches. [VERIFIED: AGENTS.md]
- Primary data source is Excel files in a OneDrive-synced folder; app must detect file changes. [VERIFIED: AGENTS.md]
- Audience is three internal users, so plan for clarity and local reliability instead of high-scale architecture. [VERIFIED: AGENTS.md]
- App is offline-first and local; SQLite and local Bun server are the current architecture. [VERIFIED: AGENTS.md and codebase grep]
- Do not use Next.js, Electron, PostgreSQL/MySQL, Redux, Moment.js, or browser PWA/service-worker offline complexity for this project. [VERIFIED: AGENTS.md]
- Use GSD workflow artifacts before repo edits; this research file is part of the GSD planning workflow. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REL-01 | User must create a release before creating or planning sprints for that release. [VERIFIED: .planning/REQUIREMENTS.md] | Add `releases`; add non-null `sprints.release_id`; route sprint creation through release detail. [VERIFIED: codebase grep] |
| REL-02 | User can assign features to a release, including adding features while the release is already in execution. [VERIFIED: .planning/REQUIREMENTS.md] | Use `release_features` with `added_at` and derived `added_during_execution` or UI warning when release status is active. [ASSUMED] |
| REL-03 | System prevents orphan stories and bugs by requiring every story or bug to belong to a feature. [VERIFIED: .planning/REQUIREMENTS.md] | Current `parent_id` is nullable and `ON DELETE SET NULL`; add repository validation plus SQLite triggers or table rebuild to prevent orphan stories/bugs. [VERIFIED: codebase grep; CITED: https://www.sqlite.org/lang_createtrigger.html] |
| REL-04 | User can plan a release visually by dragging features into a release board/timeline organized by sprints. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse existing `@dnd-kit/core` drag/drop patterns and render release columns from release sprints. [VERIFIED: package.json and codebase grep; CITED: https://dndkit.com/legacy/presets/sortable/overview/] |
| REL-05 | User can expand or shrink a feature across one or more sprints and see predicted completion sprint. [VERIFIED: .planning/REQUIREMENTS.md] | Store sprint span endpoints and compute predicted completion using cumulative `estimate_days` versus sprint capacity days. [VERIFIED: codebase grep; ASSUMED for allocation algorithm] |
| REL-06 | System warns when planned feature scope exceeds sprint or release capacity and suggests splitting oversized features. [VERIFIED: .planning/REQUIREMENTS.md] | Use existing `/api/capacity` and `estimate_days`; warn, do not block. [VERIFIED: codebase grep and 04-SKETCH-BRIEF.md] |
| UX-01 | User opens a sprint into a dedicated sprint screen with tabs for board, planning, capacity, and closure. [VERIFIED: .planning/REQUIREMENTS.md] | Move selected sprint rendering out of list page into `SprintDetailScreen` with local tabs. [VERIFIED: codebase grep] |
| UX-02 | User manages backlog through a clearer feature-first flow where features contain stories and bugs. [VERIFIED: .planning/REQUIREMENTS.md] | Replace generic root-level story/bug creation with feature cards and child creation inside feature context. [VERIFIED: 04-CONTEXT.md and current BacklogForm code] |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Release creation and sprint ownership | API / Backend | Database / Storage | Backend validates release-first invariants; SQLite persists `release_id` relationships. [VERIFIED: codebase grep] |
| Story/bug parent enforcement | Database / Storage | API / Backend | API gives clear errors; database guards direct writes and delete edge cases. [CITED: https://www.sqlite.org/lang_createtrigger.html] |
| Release board/timeline interactions | Browser / Client | API / Backend | Client owns drag/drop and span controls; backend persists allocation and recalculates warnings. [VERIFIED: codebase grep] |
| Capacity warnings | API / Backend | Browser / Client | Existing `CapacityService` owns capacity math; UI displays non-blocking warnings. [VERIFIED: src/services/capacity-service.ts] |
| Sprint drill-down tabs | Browser / Client | API / Backend | Tab layout is UI state; existing sprint APIs provide board/planning/capacity/closure data. [VERIFIED: codebase grep] |
| Feature-first backlog creation | Browser / Client | API / Backend | UI prevents ambiguous creation; API validates type/parent invariants. [VERIFIED: current BacklogForm and server.ts] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun / `bun:sqlite` | Installed `1.3.13`; project target `1.3.14` | Runtime, API server, SQLite driver | Current app already uses Bun server and `new Database("scrumbag.db")`; Bun docs confirm `bun:sqlite` is built in and supports transactions. [VERIFIED: codebase grep; CITED: https://bun.sh/docs/runtime/sqlite] |
| React | Installed `19.2.6`; npm latest `19.2.7` | SPA UI | Current app is React with controlled forms and component state; stay on installed version unless a separate dependency update is planned. [VERIFIED: package.json and npm registry] |
| TypeScript | Installed range `^5.7.0`; npm latest `6.0.3` | Domain/API/UI typing | Current `tsconfig.json` has `strict: true`; no Phase 4 reason to upgrade major TypeScript. [VERIFIED: tsconfig.json and npm registry] |
| Vite | Installed `8.0.14`; npm latest `8.0.16` | Frontend build | Existing build script is `vite build`; keep the patch-level pinned version unless a maintenance task updates it. [VERIFIED: package.json and npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@dnd-kit/core` | `6.3.1` | Drag/drop sensors, context, draggable/droppable primitives | Use for dragging features into a release and moving cards across sprint columns. [VERIFIED: package.json and npm registry; CITED: https://dndkit.com/legacy/presets/sortable/overview/] |
| `@dnd-kit/sortable` | `10.0.0` | Sortable list/column helpers | Use for ordering feature backlog, release feature rows, and sprint/board lists. [VERIFIED: package.json and npm registry; CITED: https://dndkit.com/legacy/presets/sortable/overview/] |
| `@dnd-kit/utilities` | `3.2.2` | CSS transform helpers | Continue using `CSS.Transform.toString` in `SortableItem`. [VERIFIED: src/components/SortableItem.tsx and npm registry] |
| Zod | Installed `^3.24.0`; npm latest `4.4.3` | API request validation | Keep Zod 3 for this phase because server.ts already uses Zod 3-style schemas and AGENTS marks Zod 4 compatibility with MCP as unverified. [VERIFIED: server.ts and AGENTS.md] |
| date-fns | `4.4.0` | Date ranges and working days | Existing `CapacityService` uses `eachDayOfInterval`, `isWeekend`, and `parseISO`; reuse for release sprint ranges. [VERIFIED: src/services/capacity-service.ts] |
| Tailwind CSS | `4.3.0` | UI styling | Existing app uses Tailwind utility classes; release board should stay in that visual system. [VERIFIED: src/App.tsx and npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing `@dnd-kit/core`/`sortable` | New `@dnd-kit/react` API | New docs now point to a newer API, but current repo is on legacy packages; mixing APIs would increase migration scope. [CITED: https://github.com/dnd-kit/docs; VERIFIED: package.json] |
| Release span controls with CSS grid | A new resizable timeline package | No new dependency is needed for MVP; resizing is a sprint-span domain edit, not pixel layout state. [ASSUMED] |
| SQLite triggers plus API validation | API-only validation | API-only validation can miss direct repository/database writes and delete side effects. [CITED: https://www.sqlite.org/lang_createtrigger.html; VERIFIED: current `ON DELETE SET NULL`] |

**Installation:**

```bash
# No new packages recommended for Phase 4.
# Use existing dependencies already present in package.json.
```

**Version verification:** `npm.cmd view` verified current registry metadata for `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, React, Vite, TypeScript, Tailwind CSS, `@tailwindcss/vite`, and Zod on 2026-06-01 local time. [VERIFIED: npm registry]

## Package Legitimacy Audit

> Phase 4 should not install new external packages. Existing packages below are relevant because plans should reuse them. Slopcheck could not run because Python/pip are unavailable on this machine, so the planner must gate any new or changed package install behind human verification. [VERIFIED: environment probe]

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@dnd-kit/core` | npm | Created 2021-01-02; modified 2024-12-05 [VERIFIED: npm registry] | Not checked | github.com/clauderic/dnd-kit [VERIFIED: npm registry] | Unavailable | Existing dependency; approved for reuse, no new install. |
| `@dnd-kit/sortable` | npm | Created 2021-01-02; modified 2024-12-04 [VERIFIED: npm registry] | Not checked | github.com/clauderic/dnd-kit [VERIFIED: npm registry] | Unavailable | Existing dependency; approved for reuse, no new install. |
| `@dnd-kit/utilities` | npm | Created 2021-01-02; modified 2023-11-06 [VERIFIED: npm registry] | Not checked | github.com/clauderic/dnd-kit [VERIFIED: npm registry] | Unavailable | Existing dependency; approved for reuse, no new install. |
| `zod` | npm | Created 2020-03-07; modified 2026-05-04 [VERIFIED: npm registry] | Not checked | github.com/colinhacks/zod [VERIFIED: npm registry] | Unavailable | Existing dependency; approved for reuse, no new install. |

**Packages removed due to slopcheck [SLOP] verdict:** none. [VERIFIED: no new packages proposed]
**Packages flagged as suspicious [SUS]:** none, but slopcheck unavailable. [VERIFIED: environment probe]

## Architecture Patterns

### System Architecture Diagram

```text
User opens Releases tab
  -> Browser fetches /api/releases
  -> API reads releases + release sprints + release features
  -> SQLite returns release-scoped model
  -> Browser renders release detail tabs
       -> Features tab:
            drag available feature into release
            -> POST /api/releases/:id/features
            -> API validates item.type = feature
            -> SQLite stores release_features row
            -> API returns board summary + warnings
       -> Timeline span edit:
            expand/shrink start/end sprint
            -> PUT /api/releases/:id/features/:featureId/allocation
            -> API validates sprint ids belong to release
            -> CapacityService computes sprint/release warnings
            -> Browser renders warning/split suggestion
       -> Sprint click:
            -> Browser opens SprintDetailScreen
            -> tabs fetch existing sprint items/board/capacity/closure endpoints
```

### Recommended Project Structure

```text
src/
├── data/
│   ├── release-repository.ts       # releases, release_features, allocation persistence
│   ├── sprint-repository.ts        # add release-aware sprint queries and sprint scope guards
│   └── schema.ts                   # migration tables, columns, indexes, triggers
├── domain/
│   └── types.ts                    # Release, ReleaseFeature, ReleaseBoardSummary types
├── services/
│   └── release-planning-service.ts # capacity warnings, predicted completion, split suggestions
└── components/
    ├── ReleaseList.tsx
    ├── ReleaseDetailScreen.tsx
    ├── ReleaseFeatureBoard.tsx
    ├── FeatureFirstBacklog.tsx
    └── SprintDetailScreen.tsx
```

### Pattern 1: Release-Scoped Data Model

**What:** Add `releases`, add `release_id` to `sprints`, and add `release_features` for feature membership and timeline allocation. [ASSUMED]
**When to use:** Use for all release planning and sprint creation paths in Phase 4. [VERIFIED: 04-CONTEXT.md]
**Example:**

```typescript
// Source: existing repository pattern in src/data/sprint-repository.ts [VERIFIED: codebase grep]
export class ReleaseRepository {
  constructor(private db: Database) {}

  addFeature(releaseId: string, featureId: string) {
    const feature = this.db
      .query<{ id: string; type: string }, [string]>(
        "SELECT id, type FROM backlog_items WHERE id = ?"
      )
      .get(featureId);

    if (!feature || feature.type !== "feature") {
      throw new Error("Only features can be added to a release");
    }

    return this.db.run(
      `INSERT INTO release_features (release_id, feature_id, board_order, added_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [releaseId, featureId, this.nextBoardOrder(releaseId)]
    );
  }
}
```

### Pattern 2: Advisory Capacity Math

**What:** Compute warnings from `estimate_days` versus `CapacityService.calculate(...).total_final_hours / 6`; do not block saves. [VERIFIED: src/components/SprintCapacitySummary.tsx and 04-SKETCH-BRIEF.md]
**When to use:** Use for sprint column warnings, release-level overage, and split suggestions. [VERIFIED: REL-06]
**Example:**

```typescript
// Source: existing capacity conversion in SprintCapacitySummary.tsx [VERIFIED: codebase grep]
const availableHours = capacity.total_final_hours ?? capacity.total_real_hours;
const availableDays = availableHours / 6;
const overCapacity = estimatedDays > availableDays;
```

### Pattern 3: Feature Span as Sprint-Index State

**What:** Store feature allocation as sprint ids, render with CSS grid columns, and provide expand/shrink actions that update ids. [ASSUMED]
**When to use:** Use for REL-05 instead of storing pixel widths or absolute positions. [ASSUMED]
**Example:**

```typescript
// Source: CSS grid approach inferred for release board MVP [ASSUMED]
const startIndex = sprintIds.indexOf(allocation.start_sprint_id);
const endIndex = sprintIds.indexOf(allocation.end_sprint_id);
const style = { gridColumn: `${startIndex + 2} / ${endIndex + 3}` };
```

### Anti-Patterns to Avoid

- **Making features sprint items:** Existing sprint execution accepts only stories and bugs; keeping features out preserves Phase 3 board semantics. [VERIFIED: src/data/sprint-repository.ts]
- **Using story points for capacity warnings:** Velocity is Phase 5, so Phase 4 has no verified point-to-days conversion; use `estimate_days` for capacity and display points as context. [VERIFIED: .planning/REQUIREMENTS.md and codebase grep]
- **API-only orphan prevention:** Current SQLite FK action can set `parent_id` to null on delete; add database protection or table migration too. [VERIFIED: src/data/schema.ts]
- **Mixing old and new dnd-kit APIs:** Current project imports `@dnd-kit/core` and `@dnd-kit/sortable`; new docs use different imports. [VERIFIED: package.json; CITED: https://github.com/dnd-kit/docs]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag/drop feature assignment and ordering | Custom pointer/mouse event drag engine | Existing `@dnd-kit/core` and `@dnd-kit/sortable` | Official docs cover sensors, sortable context, multiple containers, and keyboard support. [CITED: https://dndkit.com/legacy/presets/sortable/overview/] |
| Capacity calculations | Duplicate release capacity math in React | Existing `/api/capacity` and `CapacityService` | Current service already accounts for absences, holidays, waste, and overrides. [VERIFIED: src/services/capacity-service.ts] |
| Hierarchy aggregation | Manual recursive tree walking in the browser | Existing recursive SQL aggregate pattern | `BacklogRepository.aggregateEstimate` already uses a recursive CTE for descendants. [VERIFIED: src/data/backlog-repository.ts] |
| API validation | Ad hoc `if` chains only | Existing Zod schema style plus repository guards | `server.ts` consistently validates request bodies with Zod before repository calls. [VERIFIED: server.ts] |
| Accessibility for drag/drop | Mouse-only DnD | dnd-kit KeyboardSensor and localized instructions/announcements | dnd-kit docs state keyboard support, screen reader instructions, and live regions are core accessibility areas. [CITED: https://dndkit.com/legacy/guides/accessibility/] |

**Key insight:** The hard part is not drawing a timeline; it is preserving invariants across release membership, sprint membership, backlog hierarchy, capacity warnings, and Phase 5 forecasting inputs. [ASSUMED]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `scrumbag.db` exists in project root, 73,728 bytes, with current tables implied by `schema.ts`. [VERIFIED: filesystem probe] | Add migration path: create release tables, backfill an "Unplanned Release" or require manual migration for existing sprints, add/rebuild constraints or triggers for story/bug parents. [ASSUMED] |
| Live service config | No external service config found in git; sync folder defaults to `./synced`, and a `synced` directory exists. [VERIFIED: server.ts and filesystem probe] | No external service migration; keep sync path behavior unchanged. [ASSUMED] |
| OS-registered state | Running `bun` processes were found, but no OS registration was inspected or required by this phase. [VERIFIED: process probe] | Planner should stop dev server before schema migration tests if it locks `scrumbag.db`. [ASSUMED] |
| Secrets/env vars | `PORT` and `SYNC_FOLDER` are read from environment; no `.env` file was found in project root probe. [VERIFIED: server.ts and filesystem probe] | No secret migration required. [VERIFIED: codebase grep] |
| Build artifacts | `dist/index.html`, JS, and CSS build artifacts exist. [VERIFIED: filesystem probe] | Rebuild after UI changes; no data migration needed. [VERIFIED: package.json build script] |

## Common Pitfalls

### Pitfall 1: Releasing Sprints Without Backfilling Existing Data

**What goes wrong:** Adding `sprints.release_id NOT NULL` without a migration can break existing local databases with existing sprints. [VERIFIED: current schema has no release_id]
**Why it happens:** SQLite `ALTER TABLE ADD COLUMN` has restrictions around `NOT NULL` and foreign keys on existing rows. [CITED: https://www.sqlite.org/lang_altertable.html]
**How to avoid:** Add nullable `release_id`, create a default release, update existing rows, then enforce via repository validation and future table rebuild if strict `NOT NULL` is needed. [ASSUMED]
**Warning signs:** `ALTER TABLE` succeeds but old sprints remain invisible because release-scoped queries filter them out. [ASSUMED]

### Pitfall 2: Orphan Stories Reappear Through Delete

**What goes wrong:** Deleting a feature can set child `parent_id` values to null under the current FK action. [VERIFIED: src/data/schema.ts]
**Why it happens:** Current schema uses `parent_id TEXT REFERENCES backlog_items(id) ON DELETE SET NULL`. [VERIFIED: src/data/schema.ts]
**How to avoid:** Add a trigger that aborts deleting a feature with story/bug children, or rebuild the table with stricter FK behavior after migrating data. [CITED: https://www.sqlite.org/lang_createtrigger.html]
**Warning signs:** `GET /api/backlog?root=true` starts returning stories or bugs after deleting parent features. [ASSUMED]

### Pitfall 3: Using Story Points for Release Capacity Before Velocity Exists

**What goes wrong:** The board appears precise but uses an unverified conversion from story points to days. [ASSUMED]
**Why it happens:** Phase 5 owns rolling velocity and forecasts; Phase 4 only has estimates and capacity. [VERIFIED: .planning/REQUIREMENTS.md]
**How to avoid:** Use `estimate_days` for capacity warnings and display story points separately. [VERIFIED: Phase 3 implementation]
**Warning signs:** Code divides points by capacity hours or mixes points and days in the same warning threshold. [ASSUMED]

### Pitfall 4: Timeline Drag/Resize Becomes Mouse-Only

**What goes wrong:** Users can only resize spans with pointer gestures, making keyboard use impossible. [CITED: https://dndkit.com/legacy/guides/accessibility/]
**Why it happens:** Visual resize handles are easy to draw but hard to make accessible. [ASSUMED]
**How to avoid:** Provide explicit shrink/expand start/end controls or selects, then add pointer handles that call the same action. [ASSUMED]
**Warning signs:** No focusable controls can change `start_sprint_id` or `end_sprint_id`. [ASSUMED]

### Pitfall 5: Sprint Detail Screen Still Depends on List Selection State

**What goes wrong:** UX remains ambiguous because the selected sprint is still rendered below the list. [VERIFIED: current App.tsx]
**Why it happens:** Current app stores `selectedSprint` in `App.tsx` and conditionally renders planning and board inline. [VERIFIED: src/App.tsx]
**How to avoid:** Introduce `SprintDetailScreen` with route-like local state (`view: "sprint-detail", sprintId`) or equivalent app state, then render tabs inside that screen. [ASSUMED]
**Warning signs:** `SprintList` still receives `selectedSprintId` and the board remains inside the list tab. [VERIFIED: current App.tsx]

## Code Examples

### SQLite Trigger for No-Orphan Story/Bug Inserts

```sql
-- Source: SQLite RAISE() trigger docs [CITED: https://www.sqlite.org/lang_createtrigger.html]
CREATE TRIGGER IF NOT EXISTS backlog_story_bug_parent_required_insert
BEFORE INSERT ON backlog_items
WHEN NEW.type IN ('story', 'bug')
  AND (
    NEW.parent_id IS NULL OR
    NOT EXISTS (
      SELECT 1 FROM backlog_items parent
      WHERE parent.id = NEW.parent_id AND parent.type = 'feature'
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'Stories and bugs must belong to a feature');
END;
```

### Release Board Summary Shape

```typescript
// Source: recommended service contract for planner [ASSUMED]
export interface ReleaseBoardSummary {
  release: Release;
  sprints: Sprint[];
  features: Array<{
    feature: BacklogItem;
    allocation: ReleaseFeatureAllocation;
    estimate_days: number;
    story_points: number;
    predicted_completion_sprint_id: string | null;
    warnings: Array<"missing_estimates" | "sprint_over_capacity" | "release_over_capacity">;
    split_suggestion: string | null;
  }>;
}
```

### dnd-kit Existing Pattern to Reuse

```typescript
// Source: existing src/components/SortableList.tsx [VERIFIED: codebase grep]
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `docs.dndkit.com` legacy docs for `@dnd-kit/core` and `@dnd-kit/sortable` | New docs point to a newer `@dnd-kit/react` API, while legacy docs remain the match for existing package imports | GitHub docs repo archived 2026-02-21 [CITED: https://github.com/dnd-kit/docs] | Use legacy docs for this project unless planning a separate dnd-kit migration. [VERIFIED: package.json] |
| Sprint-first planning page | Release-first detail screen with feature timeline and sprint drill-down | Phase 4 product direction [VERIFIED: 04-CONTEXT.md] | Planner should not add more UI below the current sprint list. [VERIFIED: current App.tsx] |
| Global story/bug backlog candidates | Release-scoped stories/bugs under release features | Phase 4 requirement REL-02/REL-03/REL-04 [VERIFIED: .planning/REQUIREMENTS.md] | `findAvailableBacklogItems` must become release-aware. [VERIFIED: src/data/sprint-repository.ts] |

**Deprecated/outdated:**

- Root-level story/bug creation is incompatible with REL-03 and UX-02. [VERIFIED: .planning/REQUIREMENTS.md and current BacklogForm]
- Inline selected sprint planning below the sprint list is incompatible with UX-01. [VERIFIED: .planning/REQUIREMENTS.md and current App.tsx]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Use `release_features` with span endpoints rather than a denormalized per-sprint feature allocation table. | Summary, Architecture Patterns | Planner may need a different schema if product wants per-story sprint allocation from the release board. |
| A2 | Feature spans should be manual sprint-index allocations with advisory capacity math. | Summary, Pattern 3 | If user expects auto-scheduling, Phase 4 scope expands materially. |
| A3 | Split suggestion can be lightweight text/affordance, not a guided workflow. | Requirements, Pitfalls | If user wants guided split workflow, planner needs extra form/API tasks. |
| A4 | Existing sprints should be migrated into a default release. | Runtime State Inventory | If user wants manual classification, planner needs a checkpoint task. |
| A5 | In-progress release feature additions need visible warning rather than required change notes. | Requirements | If audit trail is required, schema needs release change records. |

## Open Questions

1. **Existing sprint migration policy**
   - What we know: `scrumbag.db` exists and current sprints have no release. [VERIFIED: filesystem probe and schema.ts]
   - What's unclear: Whether to auto-create a default release or ask the user to classify old sprints. [ASSUMED]
   - Recommendation: Auto-create "Release inicial" for existing sprints in migration, with a planner checkpoint before destructive changes. [ASSUMED]

2. **Feature split UX depth**
   - What we know: REL-06 requires a split suggestion, and the sketch brief calls it a suggestion affordance. [VERIFIED: .planning/REQUIREMENTS.md and 04-SKETCH-BRIEF.md]
   - What's unclear: Whether the MVP must create two new features automatically. [ASSUMED]
   - Recommendation: Start with a non-blocking suggestion and "Criar feature menor" affordance that opens the existing feature form prefilled, not automatic splitting. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Bun | Dev server, build/compile, tests | yes | 1.3.13 | Project target says 1.3.14; planner can still use current Bun for local work unless compile bug appears. [VERIFIED: env probe] |
| Node | GSD tools and npm registry checks | yes | v24.14.1 | Use direct `node` path if PATH issues occur. [VERIFIED: env probe] |
| npm CLI | Registry verification | partial | 11.11.0 via `npm.cmd`; `npm.ps1` blocked by PowerShell policy | Use `npm.cmd`, not `npm`. [VERIFIED: env probe] |
| ctx7 | Context7 docs fallback | no | - | Use official docs via web/browser. [VERIFIED: env probe] |
| Python/pip | slopcheck install | no | - | No package installs in Phase 4; human verify if package changes. [VERIFIED: env probe] |
| slopcheck | Package legitimacy gate | no | - | Treat package changes as requiring human verification. [VERIFIED: env probe] |
| Local SQLite DB | Migration target | yes | `scrumbag.db` file exists | Back up before migration tests. [VERIFIED: filesystem probe] |

**Missing dependencies with no fallback:**

- slopcheck for package legitimacy automation; do not add new packages without a human verification checkpoint. [VERIFIED: env probe]

**Missing dependencies with fallback:**

- ctx7 docs lookup; use official web docs and codebase verification. [VERIFIED: env probe]
- `npm.ps1`; use `npm.cmd`. [VERIFIED: env probe]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Project excludes complex auth/SSO for v1; local/internal use only. [VERIFIED: .planning/REQUIREMENTS.md] |
| V3 Session Management | no | No sessions in current app. [VERIFIED: codebase grep] |
| V4 Access Control | yes | Enforce release/sprint/item ownership relationships in repository methods and SQL constraints/triggers. [VERIFIED: codebase grep; CITED: https://www.sqlite.org/lang_createtrigger.html] |
| V5 Input Validation | yes | Continue Zod validation for all release and allocation endpoints. [VERIFIED: server.ts] |
| V6 Cryptography | no new crypto | Existing sync hashing remains out of Phase 4 scope. [VERIFIED: .planning/REQUIREMENTS.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampering with story/bug parent_id to create orphan executable work | Tampering | Zod schemas, repository validation, and SQLite triggers. [VERIFIED: server.ts; CITED: https://www.sqlite.org/lang_createtrigger.html] |
| Adding a story from another release feature into a sprint | Tampering | `SprintRepository.addItem` must validate sprint.release_id and item ancestor feature release membership. [ASSUMED] |
| Overwriting closed sprint scope/board | Tampering | Existing server rejects item/board changes for closed sprints; preserve this in dedicated sprint screen. [VERIFIED: server.ts] |
| Date range abuse on capacity endpoint | Denial of Service | Existing date range schema caps capacity query at 365 days; keep same pattern for release capacity. [VERIFIED: server.ts] |
| SQL injection | Tampering | Existing repositories use parameter placeholders; continue this pattern. [VERIFIED: data repositories] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project constraints and stack decisions.
- `.planning/phases/04-release-planning-ux-redesign/04-CONTEXT.md` - locked Phase 4 product direction.
- `.planning/phases/04-release-planning-ux-redesign/04-SKETCH-BRIEF.md` - release board UX constraints.
- `.planning/REQUIREMENTS.md` - REL-01 through REL-06 and UX-01 through UX-02.
- `src/domain/types.ts`, `src/data/schema.ts`, `src/data/backlog-repository.ts`, `src/data/sprint-repository.ts`, `server.ts`, `src/App.tsx`, sprint components - existing architecture and invariants.
- https://dndkit.com/legacy/presets/sortable/overview/ - legacy sortable API matching installed packages.
- https://dndkit.com/legacy/guides/accessibility/ - keyboard and screen-reader guidance.
- https://bun.sh/docs/runtime/sqlite - `bun:sqlite` transactions and API.
- https://www.sqlite.org/lang_createtrigger.html - triggers and `RAISE()`.
- https://www.sqlite.org/lang_createtable.html - CHECK/FK constraint behavior.
- https://www.sqlite.org/lang_altertable.html - SQLite migration restrictions.

### Secondary (MEDIUM confidence)

- npm registry via `npm.cmd view` - current package versions, modified dates, repository URLs.
- dnd-kit docs GitHub repo - confirms legacy/current docs split and archive date: https://github.com/dnd-kit/docs

### Tertiary (LOW confidence)

- None used as authoritative input.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - current package.json, codebase, npm registry, and official docs align.
- Architecture: HIGH for existing constraints, MEDIUM for proposed release allocation schema because no prior implementation exists.
- Pitfalls: HIGH for migration/orphan/sprint-screen risks from current code, MEDIUM for UX resize recommendations.

**Research date:** 2026-06-01 local time
**Valid until:** 2026-06-08 for package/version claims; 2026-07-01 for codebase-only architecture findings unless Phase 4 starts earlier.
