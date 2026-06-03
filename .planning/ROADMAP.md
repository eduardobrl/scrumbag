# Roadmap: Squad Planner

**Created:** 2026-06-02
**Granularity:** Coarse
**Planning Mode:** MVP

This roadmap favors broad vertical phases. Each phase should leave the product more usable end to end, while keeping implementation order aligned with data and workflow dependencies.

## Phase Summary

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | Local Foundation And Squad Setup | Establish the local app shell, persistence, navigation, settings, and squad/calendar data needed for capacity. | APP-01 to APP-06, SQUAD-01 to SQUAD-05 |
| 2 | 3/3 | Complete    | 2026-06-03 |
| 3 | Feature, Story, And Backlog Planning | Let users model release scope as features and stories, aggregate estimates, and plan stories from backlog into sprints. | FEAT-01 to FEAT-06, BACK-01 to BACK-04 |
| 4 | Sprint Board, Capacity Engine, And Leakage | Deliver the operational sprint board, full capacity calculations, over-capacity warnings, sprint closure, reopening, and leakage history. | BOARD-01 to BOARD-04, CAP-01 to CAP-05, SPR-04 to SPR-08 |
| 5 | Release Intelligence, Reports, MCP, And AI | Provide dashboard, timeline, progress, reports, exports, MCP tools, and the AI assistant. | DASH-01 to DASH-04, PROG-01 to PROG-02, REP-01 to REP-03, MCP-01 to MCP-05, AI-01 to AI-04 |

## Phases

### Phase 1: Local Foundation And Squad Setup

**Goal:** A user can run the local app, navigate the main shell, persist data in SQLite, configure core settings, and maintain squad/calendar data that future capacity calculations depend on.
**Mode:** mvp

**Requirements:** APP-01, APP-02, APP-03, APP-04, APP-05, APP-06, SQUAD-01, SQUAD-02, SQUAD-03, SQUAD-04, SQUAD-05

**Success Criteria**:

1. A fresh checkout can be installed and started locally, then opened in a browser on localhost.
2. The app shell shows side navigation and global release context/header without broken routes.
3. SQLite persistence stores app settings, squad members, absences, and holidays across restarts.
4. The Squad screen supports member, absence, and holiday CRUD with validation and summary metrics.
5. The Settings screen exposes capacity defaults and MCP host/port configuration.

**UI hint:** yes

**Execution Plans:**

**Wave 1**

- `01-01` - Walking skeleton: scaffold the local Next.js/SQLite app, app shell, and first persisted squad member loop.

**Wave 2** *(blocked on Wave 1 completion)*

- `01-02` - Persisted Settings screen and API for capacity defaults and local MCP configuration.
- `01-03` - Squad and calendar management for members, absences, holidays, and summary metrics.

Cross-cutting constraints:

- Keep all runtime data local, with SQLite at `./data/squad-planner.db`.
- Keep browser/API access localhost-only and do not add auth, remote DB, or external integrations in Phase 1.
- Preserve desktop-first operational UI patterns: side navigation, global header, tables, badges, and summary cards.

### Phase 2: Release And Sprint Planning Core

**Goal:** A user can create a release, have sprints generated automatically, inspect the release and sprint list, and adjust sprint dates/goals safely.
**Mode:** mvp

**Requirements:** REL-01, REL-02, REL-03, REL-04, SPR-01, SPR-02, SPR-03

**Success Criteria**:

1. Release create/edit/list/detail flows capture all required release fields and prevent multiple in-progress releases.
2. Saving a release generates sequential, non-overlapping sprints from business-day dates.
3. The final sprint absorbs remaining business days instead of creating an impractically small final sprint.
4. Sprint list/detail surfaces period, status, goal, planned effort placeholders, capacity placeholders, and risk placeholders ready for later capacity wiring.
5. Editing sprint dates prevents overlap, warns about gaps, and triggers recalculation hooks for affected sprint summaries.

**UI hint:** yes

**Execution Plans:**

**Wave 1**

- `02-01` - Release creation slice with generated persisted sprints and schema sync.

**Wave 2** *(blocked on Wave 1 completion)*

- `02-02` - Release list, detail, edit, sprint reconciliation, and active release header context.
- `02-03` - Sprint list, detail, goal/date editing, overlap blocking, gap warnings, and planning-summary placeholders.

### Phase 3: Feature, Story, And Backlog Planning

**Goal:** A user can break release scope into features and stories, keep estimates aggregated automatically, and move unplanned stories from backlog into selected sprints with impact preview.
**Mode:** mvp

**Requirements:** FEAT-01, FEAT-02, FEAT-03, FEAT-04, FEAT-05, FEAT-06, BACK-01, BACK-02, BACK-03, BACK-04

**Success Criteria**:

1. Feature and story CRUD flows capture all specified fields and use cancelation instead of destructive deletion for scoped items.
2. Feature totals, calculated status, progress, and date/timeline placeholders update from associated non-canceled stories.
3. Backlog screen lists unplanned stories and supports release, feature, status, text, unplanned, and canceled filters.
4. Planning a backlog story into a sprint shows capacity impact before confirmation and then moves the story to sprint backlog.
5. Removing a story from a sprint returns it to general backlog with Backlog status.

**UI hint:** yes

**Execution Plans:**

**Wave 1**

- `03-01` - Feature and Story data foundation, feature CRUD, cancellation, and aggregate metrics.

**Wave 2** *(blocked on Wave 1 completion)*

- `03-02` - Story CRUD from feature detail with estimates, status, cancellation, and aggregate recalculation.
- `03-03` - Backlog filters, story-to-sprint planning preview, sprint assignment, return-to-backlog, and planned-effort updates.

Cross-cutting constraints:

- Keep Feature and Story data local in SQLite and tied to the existing Release/Sprint model.
- Use cancellation statuses instead of destructive deletion for scoped feature and story items.
- Exclude canceled stories from feature totals, progress, and planned effort.
- Keep real capacity, board drag-and-drop, sprint closure, reopening, and leakage history deferred to Phase 4.

### Phase 4: Sprint Board, Capacity Engine, And Leakage

**Goal:** A user can execute a sprint on a drag-and-drop board while the system calculates real capacity, highlights over-capacity plans, closes/reopens sprints, and records leaked stories.
**Mode:** mvp

**Requirements:** BOARD-01, BOARD-02, BOARD-03, BOARD-04, CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, SPR-04, SPR-05, SPR-06, SPR-07, SPR-08

**Success Criteria**:

1. Sprint detail shows fixed board columns and supports drag-and-drop status changes.
2. Sprint capacity is calculated from active members, business days, absences, holidays, meeting percentage, support percentage, and 8-hour day normalization.
3. Sprint screens display gross capacity, net capacity, planned effort, remaining capacity, occupancy, and visual overflow warnings while still allowing over-capacity planning.
4. Closing a sprint leaves finished stories in place, moves unfinished stories to the next sprint, creates the next sprint when needed, and records leakage events.
5. Reopening a sprint allows edits again without deleting leakage history.

**UI hint:** yes

### Phase 5: Release Intelligence, Reports, MCP, And AI

**Goal:** A user can understand release health through dashboard/timeline/progress/reporting, export planning data, and ask a local AI assistant for MCP-grounded analysis and controlled suggestions.
**Mode:** mvp

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, PROG-01, PROG-02, REP-01, REP-02, REP-03, MCP-01, MCP-02, MCP-03, MCP-04, MCP-05, AI-01, AI-02, AI-03, AI-04

**Success Criteria**:

1. Dashboard summarizes active release progress, total capacity, planned effort, risk, feature/story counts, finished stories, leaked stories, alerts, timeline, and sprint table.
2. Timeline shows feature spans across sprints, inactive gaps inside a span, completion progress, finished sprints, and leaked sprints.
3. Reports screen generates the specified planning, capacity, sprint-story, feature-progress, leakage, planned-versus-capacity, and timeline reports in CSV and Excel.
4. MCP server binds to localhost by default and exposes read, suggestion, explicit write, and critical-operation-safe tools.
5. AI assistant chat and quick prompts answer using MCP data and require explicit confirmation before applying sensitive changes.

**UI hint:** yes

## Coverage

| Phase | Requirement Count | Status |
|-------|-------------------|--------|
| Phase 1 | 11 | Complete |
| Phase 2 | 7 | Complete |
| Phase 3 | 10 | Ready to execute |
| Phase 4 | 13 | Pending |
| Phase 5 | 18 | Pending |

**Total v1 requirements:** 60
**Mapped requirements:** 60
**Unmapped requirements:** 0

---
*Roadmap created: 2026-06-02*
*Last updated: 2026-06-02 after initialization*
